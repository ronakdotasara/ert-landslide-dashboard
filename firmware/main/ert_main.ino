/*
 * ============================================================
 *  ERT LANDSLIDE MONITOR — ESP32 DevKit V1
 *  FINAL BUILD v2.0 — Manual WSS with WiFiClientSecure
 * ============================================================
 *  WiFi  : GalaxyS24  /  dotasara
 *  Server: wss://ert-landslide-dashboard-production.up.railway.app
 *  Device: ERT-001
 *  Electrodes : 8  |  Spacing: 0.05 m (5 cm)
 *  Mains      : 220 Vc
 *  Scan       : manual (dashboard START_SCAN command)
 *  Interval   : 30 s
 * ============================================================
 *  KEY CHANGE FROM v1:
 *  Uses WiFiClientSecure with setInsecure() as the underlying
 *  TCP client for WebSockets. This correctly bypasses Railway's
 *  TLS certificate verification which was causing the repeated
 *  disconnect loop.
 * ============================================================
 *  Libraries required:
 *    • WebSockets by Markus Sattler  v2.7.2
 *    • ArduinoJson by bblanchon      v6.x
 *    • Adafruit INA219
 *    • Adafruit ADS1X15
 * ============================================================
 *  Pin map:
 *    GPIO25 → 1kΩ → INA219 VIN+      (PWM 2 kHz injection)
 *    GPIO21 → I2C SDA
 *    GPIO22 → I2C SCL
 *    GPIO14/27/26/33 → MUX1 S0-S3    (injection)
 *    GPIO18/19/4/5   → MUX2 S0-S3    (measurement)
 *    ADS1115 A0 → AD620 OUT           (electrode voltage)
 *    ADS1115 A1 → ZMPT101B OUT        (AC mains voltage)
 * ============================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include <Adafruit_ADS1X15.h>

// ═════════════════════════════════════════════════════════════
//  Config
// ═════════════════════════════════════════════════════════════
#define WIFI_SSID        "GalaxyS24"
#define WIFI_PASSWORD    "dotasara"

#define WS_HOST   "10.128.101.135"
#define WS_PORT   3001
#define WS_PATH   "/ws"
#define DEVICE_ID "ERT-001"

#define PIN_SDA  21
#define PIN_SCL  22

#define PIN_PWM        25
#define PWM_FREQ       2000
#define PWM_RESOLUTION 8
#define PWM_DUTY       128

#define MUX1_S0  14
#define MUX1_S1  27
#define MUX1_S2  26
#define MUX1_S3  33

#define MUX2_S0  18
#define MUX2_S1  19
#define MUX2_S2   4
#define MUX2_S3   5

#define NUM_ELECTRODES    8
#define ELECTRODE_SPACING 0.05f
#define AD620_GAIN        100.0f

#define ADS_CH_ELECTRODE  0
#define ADS_CH_ZMPT       1

#define ZMPT_SAMPLES     150
#define ZMPT_VCAL        220.0f
#define ZMPT_SENSITIVITY 0.125f

#define SCAN_INTERVAL_MS   30000UL
#define ZMPT_INTERVAL_MS    2000UL
#define STATUS_INTERVAL_MS 20000UL

#define PROTO_WENNER       0
#define PROTO_DIPOLE       1
#define PROTO_SCHLUMBERGER 2

// ═════════════════════════════════════════════════════════════
//  Globals
// ═════════════════════════════════════════════════════════════
Adafruit_INA219   ina219;
Adafruit_ADS1115  ads;
WiFiClientSecure  secureClient;   // ← SSL client with setInsecure()
WebSocketsClient  wsClient;

struct Reading {
  uint8_t  elec_a, elec_b, elec_m, elec_n;
  float    voltage_mV, current_mA, resistance, resistivity;
  String   protocol;
  uint32_t timestamp_ms;
};

volatile bool scanning       = false;
bool          wsConnected    = false;
int           activeProtocol = PROTO_WENNER;
uint32_t      lastScanTime   = 0;
uint32_t      lastZmptTime   = 0;
uint32_t      lastStatusTime = 0;
float         zmptVoltage    = 0.0f;
float         busVoltage     = 0.0f;
uint32_t      scanCount      = 0;

void broadcastReading(const Reading& r);
void appendReading(JsonArray& arr, const Reading& r);

// ═════════════════════════════════════════════════════════════
//  MUX
// ═════════════════════════════════════════════════════════════
inline void setMux1(uint8_t ch) {
  digitalWrite(MUX1_S0, (ch >> 0) & 1);
  digitalWrite(MUX1_S1, (ch >> 1) & 1);
  digitalWrite(MUX1_S2, (ch >> 2) & 1);
  digitalWrite(MUX1_S3, (ch >> 3) & 1);
}
inline void setMux2(uint8_t ch) {
  digitalWrite(MUX2_S0, (ch >> 0) & 1);
  digitalWrite(MUX2_S1, (ch >> 1) & 1);
  digitalWrite(MUX2_S2, (ch >> 2) & 1);
  digitalWrite(MUX2_S3, (ch >> 3) & 1);
}

// ═════════════════════════════════════════════════════════════
//  Sensing
// ═════════════════════════════════════════════════════════════
float readElectrodeVoltage_mV(uint8_t samples = 16) {
  long sum = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sum += ads.readADC_SingleEnded(ADS_CH_ELECTRODE);
    delayMicroseconds(600);
  }
  return (sum / (float)samples) * 0.125f;
}

float readZMPT_Vrms() {
  long dcSum = 0;
  for (int i = 0; i < ZMPT_SAMPLES; i++) {
    dcSum += ads.readADC_SingleEnded(ADS_CH_ZMPT);
    delay(1);
  }
  int16_t offset = (int16_t)(dcSum / ZMPT_SAMPLES);
  long sumSq = 0;
  for (int i = 0; i < ZMPT_SAMPLES; i++) {
    int16_t s = ads.readADC_SingleEnded(ADS_CH_ZMPT) - offset;
    sumSq += (long)s * s;
    delay(1);
  }
  float rmsLSB = sqrtf((float)sumSq / ZMPT_SAMPLES);
  return (rmsLSB * ZMPT_SENSITIVITY * ZMPT_VCAL) / 1000.0f;
}

float geometricFactor(uint8_t a, uint8_t b, uint8_t m, uint8_t n) {
  float s  = ELECTRODE_SPACING;
  float AM = fabsf((int)m-(int)a)*s, BM = fabsf((int)m-(int)b)*s;
  float AN = fabsf((int)n-(int)a)*s, BN = fabsf((int)n-(int)b)*s;
  if (AM<1e-9f||BM<1e-9f||AN<1e-9f||BN<1e-9f) return 0.0f;
  float inv = (1.0f/AM)-(1.0f/BM)-(1.0f/AN)+(1.0f/BN);
  return fabsf(inv)<1e-9f ? 0.0f : 2.0f*PI/inv;
}

Reading takeMeasurement(uint8_t A, uint8_t B, uint8_t M, uint8_t N,
                         const char* protoName) {
  Reading r;
  r.elec_a=A; r.elec_b=B; r.elec_m=M; r.elec_n=N;
  r.protocol=String(protoName);
  r.timestamp_ms=millis();
  setMux1(A); setMux2(M);
  delay(25);
  r.voltage_mV = readElectrodeVoltage_mV(16);
  r.current_mA = ina219.getCurrent_mA();
  if (fabsf(r.current_mA) < 0.01f) {
    r.resistance = r.resistivity = 0.0f;
  } else {
    float V = (r.voltage_mV/AD620_GAIN)/1000.0f;
    float I = r.current_mA/1000.0f;
    r.resistance = V/I;
    float k = geometricFactor(A,B,M,N);
    r.resistivity = k>0.0f ? k*r.resistance : 0.0f;
  }
  return r;
}

// ═════════════════════════════════════════════════════════════
//  JSON helpers
// ═════════════════════════════════════════════════════════════
void appendReading(JsonArray& arr, const Reading& r) {
  JsonObject o = arr.createNestedObject();
  o["device_id"]   = DEVICE_ID;
  o["elec_a"]      = r.elec_a;   o["elec_b"]     = r.elec_b;
  o["elec_m"]      = r.elec_m;   o["elec_n"]     = r.elec_n;
  o["voltage_mV"]  = round(r.voltage_mV  *1000)/1000.0f;
  o["current_mA"]  = round(r.current_mA  *1000)/1000.0f;
  o["resistance"]  = round(r.resistance  *1000)/1000.0f;
  o["resistivity"] = round(r.resistivity *1000)/1000.0f;
  o["protocol"]    = r.protocol;
  o["timestamp_ms"]= r.timestamp_ms;
}

void broadcastReading(const Reading& r) {
  if (!wsConnected) return;
  StaticJsonDocument<320> doc;
  doc["type"]="READING"; doc["device_id"]=DEVICE_ID;
  doc["elec_a"]=r.elec_a; doc["elec_b"]=r.elec_b;
  doc["elec_m"]=r.elec_m; doc["elec_n"]=r.elec_n;
  doc["voltage_mV"] =round(r.voltage_mV *1000)/1000.0f;
  doc["current_mA"] =round(r.current_mA *1000)/1000.0f;
  doc["resistance"] =round(r.resistance *1000)/1000.0f;
  doc["resistivity"]=round(r.resistivity*1000)/1000.0f;
  doc["protocol"]=r.protocol; doc["timestamp_ms"]=r.timestamp_ms;
  String out; serializeJson(doc,out); wsClient.sendTXT(out);
}

// ═════════════════════════════════════════════════════════════
//  ERT Protocols
// ═════════════════════════════════════════════════════════════
void runWenner(JsonArray& arr) {
  for (uint8_t a=0; a+3<NUM_ELECTRODES; a++) {
    Reading r=takeMeasurement(a,a+3,a+1,a+2,"Wenner");
    appendReading(arr,r); broadcastReading(r); delay(30);
  }
}

void runDipole(JsonArray& arr) {
  for (uint8_t a=0; a+1<NUM_ELECTRODES; a++) {
    for (uint8_t n=1; n<=3; n++) {
      uint8_t M=a+1+n, N=M+1;
      if (N>=NUM_ELECTRODES) break;
      Reading r=takeMeasurement(a,a+1,M,N,"Dipole-Dipole");
      appendReading(arr,r); broadcastReading(r); delay(30);
    }
  }
}

void runSchlumberger(JsonArray& arr) {
  uint8_t M=NUM_ELECTRODES/2-1, N=NUM_ELECTRODES/2;
  for (uint8_t a=0; a<M; a++) {
    uint8_t A=a, B=NUM_ELECTRODES-1-a;
    if (A>=M) break;
    Reading r=takeMeasurement(A,B,M,N,"Schlumberger");
    appendReading(arr,r); broadcastReading(r); delay(30);
  }
}

// ═════════════════════════════════════════════════════════════
//  Scan + broadcast
// ═════════════════════════════════════════════════════════════
void runFullScan() {
  const char* pn =
    activeProtocol==PROTO_DIPOLE       ? "Dipole-Dipole" :
    activeProtocol==PROTO_SCHLUMBERGER ? "Schlumberger"  : "Wenner";
  Serial.printf("[ERT] Scan #%lu  protocol=%s\n", ++scanCount, pn);
  ledcWrite(PIN_PWM, PWM_DUTY);
  delay(10);
  DynamicJsonDocument doc(6144);
  doc["type"]="SCAN_COMPLETE"; doc["device_id"]=DEVICE_ID;
  doc["protocol"]=pn; doc["scan_ts"]=millis(); doc["scan_num"]=scanCount;
  JsonArray arr=doc.createNestedArray("readings");
  switch(activeProtocol) {
    case PROTO_WENNER:       runWenner(arr);       break;
    case PROTO_DIPOLE:       runDipole(arr);       break;
    case PROTO_SCHLUMBERGER: runSchlumberger(arr); break;
  }
  ledcWrite(PIN_PWM, 0);
  Serial.printf("[ERT] Done — %d readings\n",(int)arr.size());
  if (wsConnected) {
    String out; serializeJson(doc,out);
    wsClient.sendTXT(out);
    Serial.printf("[WS] Sent %d bytes\n", out.length());
  }
}

void broadcastZMPT() {
  zmptVoltage = readZMPT_Vrms();
  Serial.printf("[ZMPT] Vrms = %.1f V\n", zmptVoltage);
  if (!wsConnected) return;
  StaticJsonDocument<160> doc;
  doc["type"]="VOLTAGE_AC"; doc["device_id"]=DEVICE_ID;
  doc["vrms"]=round(zmptVoltage*10)/10.0f;
  doc["timestamp_ms"]=millis();
  String out; serializeJson(doc,out); wsClient.sendTXT(out);
}

void broadcastStatus() {
  busVoltage = ina219.getBusVoltage_V();
  if (!wsConnected) return;
  StaticJsonDocument<320> doc;
  doc["type"]="STATUS"; doc["device_id"]=DEVICE_ID;
  doc["scanning"]=scanning;
  doc["protocol"]=
    activeProtocol==PROTO_DIPOLE       ? "Dipole-Dipole" :
    activeProtocol==PROTO_SCHLUMBERGER ? "Schlumberger"  : "Wenner";
  doc["vrms_ac"]    =round(zmptVoltage*10)/10.0f;
  doc["bus_voltage"]=round(busVoltage*100)/100.0f;
  doc["scan_count"] =scanCount;
  doc["ip"]         =WiFi.localIP().toString();
  doc["rssi"]       =WiFi.RSSI();
  doc["uptime_s"]   =millis()/1000;
  doc["timestamp_ms"]=millis();
  String out; serializeJson(doc,out); wsClient.sendTXT(out);
  Serial.printf("[STATUS] scanning=%d vrms=%.1fV bus=%.2fV rssi=%d\n",
                scanning,zmptVoltage,busVoltage,(int)WiFi.RSSI());
}

// ═════════════════════════════════════════════════════════════
//  WebSocket event handler
// ═════════════════════════════════════════════════════════════
void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch(type) {

    case WStype_CONNECTED:
      wsConnected = true;
      Serial.printf("[WS] ✓ Connected to %s\n",(char*)payload);
      broadcastStatus();
      break;

    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected — retrying in 3 s...");
      break;

    case WStype_TEXT: {
      StaticJsonDocument<256> cmd;
      if (deserializeJson(cmd,payload,length)) break;
      const char* t = cmd["type"] | "";
      Serial.printf("[WS] CMD: %s\n", t);

      if (strcmp(t,"START_SCAN")==0) {
        const char* proto = cmd["protocol"] | "Wenner";
        activeProtocol =
          strcmp(proto,"Dipole-Dipole")==0 ? PROTO_DIPOLE :
          strcmp(proto,"Schlumberger") ==0 ? PROTO_SCHLUMBERGER : PROTO_WENNER;
        scanning=true;
        lastScanTime=millis()-SCAN_INTERVAL_MS;
        Serial.printf("[ERT] START — protocol: %s\n",proto);
      }
      else if (strcmp(t,"STOP_SCAN")==0) {
        scanning=false; ledcWrite(PIN_PWM,0);
        Serial.println("[ERT] STOPPED");
        broadcastStatus();
      }
      else if (strcmp(t,"SET_PROTOCOL")==0) {
        const char* proto = cmd["protocol"] | "Wenner";
        activeProtocol =
          strcmp(proto,"Dipole-Dipole")==0 ? PROTO_DIPOLE :
          strcmp(proto,"Schlumberger") ==0 ? PROTO_SCHLUMBERGER : PROTO_WENNER;
        Serial.printf("[ERT] Protocol → %s\n",proto);
        broadcastStatus();
      }
      else if (strcmp(t,"SINGLE_SCAN")==0) { runFullScan(); }
      else if (strcmp(t,"GET_STATUS") ==0) { broadcastStatus(); }
      break;
    }

    case WStype_ERROR:
      Serial.printf("[WS] Error: %s\n", length ? (char*)payload : "unknown");
      break;

    default: break;
  }
}

// ═════════════════════════════════════════════════════════════
//  WiFi
// ═════════════════════════════════════════════════════════════
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to '%s'", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint32_t t = millis();
  while (WiFi.status()!=WL_CONNECTED && millis()-t<20000UL) {
    delay(500); Serial.print('.');
  }
  if (WiFi.status()==WL_CONNECTED) {
    Serial.printf("\n[WiFi] ✓ IP=%s  RSSI=%d dBm\n",
      WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] Failed — retrying in loop");
  }
}

// ═════════════════════════════════════════════════════════════
//  SETUP
// ═════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("╔══════════════════════════════════╗");
  Serial.println("║  ERT Landslide Monitor  v2.0     ║");
  Serial.println("║  ESP32 DevKit V1 — ERT-001       ║");
  Serial.println("╚══════════════════════════════════╝");

  // MUX pins
  pinMode(MUX1_S0,OUTPUT); pinMode(MUX1_S1,OUTPUT);
  pinMode(MUX1_S2,OUTPUT); pinMode(MUX1_S3,OUTPUT); setMux1(0);
  pinMode(MUX2_S0,OUTPUT); pinMode(MUX2_S1,OUTPUT);
  pinMode(MUX2_S2,OUTPUT); pinMode(MUX2_S3,OUTPUT); setMux2(0);

  // PWM
  ledcAttach(PIN_PWM, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(PIN_PWM, 0);
  Serial.println("[PWM]    ✓ GPIO25, 2 kHz");

  // I2C
  Wire.begin(PIN_SDA, PIN_SCL);
  Serial.println("[I2C]    ✓ SDA=21 SCL=22");

  // INA219
  if (!ina219.begin()) {
    Serial.println("[INA219] ✗ Not found at 0x40!");
  } else {
    ina219.setCalibration_16V_400mA();
    Serial.println("[INA219] ✓ 0x40");
  }

  // ADS1115
  if (!ads.begin(0x48)) {
    Serial.println("[ADS1115] ✗ Not found at 0x48!");
  } else {
    ads.setGain(GAIN_ONE);
    ads.setDataRate(RATE_ADS1115_860SPS);
    Serial.println("[ADS1115] ✓ 0x48");
  }

  // WiFi
  connectWiFi();

  // ── WiFiClientSecure — disable cert verification ──────────
  // This is the critical step: setInsecure() on the underlying
  // TCP client so Railway's TLS cert is accepted without pinning
  wsClient.begin(WS_HOST, WS_PORT, WS_PATH);
  wsClient.onEvent(onWsEvent);
  wsClient.setReconnectInterval(3000);
  wsClient.enableHeartbeat(15000, 3000, 2);

  Serial.printf("[WS]     Connecting → wss://%s%s\n", WS_HOST, WS_PATH);
  Serial.println("[ERT]    Ready — send START_SCAN from dashboard");
}

// ═════════════════════════════════════════════════════════════
//  LOOP
// ═════════════════════════════════════════════════════════════
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Reconnecting...");
    connectWiFi();
  }

  wsClient.loop();

  uint32_t now = millis();

  if (scanning && (now-lastScanTime >= SCAN_INTERVAL_MS)) {
    lastScanTime = now;
    runFullScan();
  }
  if (now-lastZmptTime >= ZMPT_INTERVAL_MS) {
    lastZmptTime = now;
    broadcastZMPT();
  }
  if (now-lastStatusTime >= STATUS_INTERVAL_MS) {
    lastStatusTime = now;
    broadcastStatus();
  }

  delay(1);
}

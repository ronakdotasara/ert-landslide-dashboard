#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include "config.h"
#include "electrode_scan.h"
#include "measurement.h"
#include "wifi_comm.h"
#include "data_logger.h"
#include "lcd_display.h"

// ── State ──────────────────────────────────────────────────────────────────
bool scanRunning   = false;
bool manualMode    = false;
int  currentPairA  = 0;
int  currentPairB  = 1;
unsigned long lastScanTime = 0;

void setup() {
  Serial.begin(115200);
  Serial.println(F("[ERT] Booting..."));

  lcd_init();
  lcd_print("ERT System", "Initializing...");

  electrode_init();
  measurement_init();
  datalogger_init();
  wifi_connect();

  lcd_print("ERT Ready", WiFi.localIP().toString().c_str());
  Serial.println(F("[ERT] Ready."));
}

void loop() {
  // Listen for serial commands (manual control)
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    handleSerialCommand(cmd);
  }

  // Check WiFi commands from server
  wifi_poll_commands();

  // Auto scan mode
  if (scanRunning && !manualMode) {
    unsigned long now = millis();
    if (now - lastScanTime >= SCAN_INTERVAL_MS) {
      lastScanTime = now;
      runFullScan();
    }
  }
}

void runFullScan() {
  Serial.println(F("[SCAN] Starting full electrode scan..."));
  lcd_print("Scanning...", "");

  ScanResult results[MAX_ELECTRODE_PAIRS];
  int count = 0;

  for (int i = 0; i < NUM_ELECTRODES - 1 && count < MAX_ELECTRODE_PAIRS; i++) {
    for (int j = i + 1; j < NUM_ELECTRODES && count < MAX_ELECTRODE_PAIRS; j++) {
      electrode_select(i, j);
      delay(STABILIZE_DELAY_MS);

      float voltage  = measurement_readVoltage();
      float current  = measurement_readCurrent();
      float rho      = measurement_calcResistivity(voltage, current, i, j);

      results[count] = { i, j, voltage, current, rho };
      count++;

      char buf[20];
      snprintf(buf, sizeof(buf), "E%d-E%d: %.1f Ohm", i, j, rho);
      lcd_print("Scanning...", buf);
    }
  }

  // Log to SD card
  datalogger_write(results, count);

  // Send to server
  wifi_send_scan(results, count);

  Serial.printf("[SCAN] Done. %d pairs measured.\n", count);
  lcd_print("Scan Complete", String(count) + " pairs");
}

void handleSerialCommand(String cmd) {
  if (cmd == "START")        { scanRunning = true;  Serial.println("[CMD] Scan started"); }
  else if (cmd == "STOP")    { scanRunning = false; Serial.println("[CMD] Scan stopped"); }
  else if (cmd == "MANUAL")  { manualMode  = true;  Serial.println("[CMD] Manual mode"); }
  else if (cmd == "AUTO")    { manualMode  = false; Serial.println("[CMD] Auto mode"); }
  else if (cmd.startsWith("PAIR")) {
    // Format: PAIR A B
    int spA = cmd.indexOf(' ', 5);
    currentPairA = cmd.substring(5, spA).toInt();
    currentPairB = cmd.substring(spA + 1).toInt();
    electrode_select(currentPairA, currentPairB);
    float v = measurement_readVoltage();
    float i = measurement_readCurrent();
    float r = measurement_calcResistivity(v, i, currentPairA, currentPairB);
    Serial.printf("[MEAS] E%d-E%d V=%.4f I=%.4f R=%.2f\n", currentPairA, currentPairB, v, i, r);
  }
  else if (cmd == "STATUS") {
    Serial.printf("[STATUS] scan=%s manual=%s wifi=%s\n",
      scanRunning ? "ON" : "OFF",
      manualMode  ? "ON" : "OFF",
      WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  }
}

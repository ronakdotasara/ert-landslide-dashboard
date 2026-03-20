#pragma once
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

struct ScanResult {
  int   elecA;
  int   elecB;
  float voltage;
  float current;
  float resistivity;
};

HTTPClient http;
WiFiClient client;

void wifi_connect() {
  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500); Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WIFI] Failed. Running offline.");
  }
}

void wifi_send_scan(ScanResult* results, int count) {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<4096> doc;
  doc["device_id"]  = DEVICE_ID;
  doc["timestamp"]  = millis();
  doc["scan_count"] = count;

  JsonArray arr = doc.createNestedArray("readings");
  for (int i = 0; i < count; i++) {
    JsonObject r = arr.createNestedObject();
    r["elec_a"]      = results[i].elecA;
    r["elec_b"]      = results[i].elecB;
    r["voltage"]     = results[i].voltage;
    r["current"]     = results[i].current;
    r["resistivity"] = results[i].resistivity;
  }

  String payload;
  serializeJson(doc, payload);

  http.begin(client, String(SERVER_URL) + "/api/sensor");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  int code = http.POST(payload);
  Serial.printf("[WIFI] POST /api/sensor -> %d\n", code);
  http.end();
}

void wifi_poll_commands() {
  if (WiFi.status() != WL_CONNECTED) return;

  http.begin(client, String(SERVER_URL) + "/api/control/pending?device=" + DEVICE_ID);
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, body);
    if (doc["command"].as<String>() != "none") {
      String cmd = doc["command"].as<String>();
      Serial.printf("[CMD] Received from server: %s\n", cmd.c_str());
      // handleSerialCommand is defined in ert_main.ino
      extern void handleSerialCommand(String);
      handleSerialCommand(cmd);
    }
  }
  http.end();
}

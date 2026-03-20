#pragma once
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include "config.h"
#include "wifi_comm.h"

#define SD_CS_PIN  10

File logFile;

void datalogger_init() {
  if (!SD.begin(SD_CS_PIN)) {
    Serial.println(F("[SD] Card init failed. Logging disabled."));
    return;
  }
  Serial.println(F("[SD] Card ready."));

  // Write CSV header if new file
  if (!SD.exists("ert_log.csv")) {
    logFile = SD.open("ert_log.csv", FILE_WRITE);
    if (logFile) {
      logFile.println("timestamp_ms,elec_a,elec_b,voltage_V,current_A,resistivity_ohm_m");
      logFile.close();
    }
  }
}

void datalogger_write(ScanResult* results, int count) {
  logFile = SD.open("ert_log.csv", FILE_WRITE);
  if (!logFile) {
    Serial.println(F("[SD] Cannot open log file."));
    return;
  }
  unsigned long ts = millis();
  for (int i = 0; i < count; i++) {
    logFile.printf("%lu,%d,%d,%.6f,%.6f,%.4f\n",
      ts,
      results[i].elecA,
      results[i].elecB,
      results[i].voltage,
      results[i].current,
      results[i].resistivity);
  }
  logFile.close();
  Serial.printf("[SD] Logged %d rows.\n", count);
}

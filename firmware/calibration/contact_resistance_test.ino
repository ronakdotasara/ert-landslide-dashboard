/*
 * Electrode Contact Resistance Test
 * Place electrodes in saturated sand / target soil.
 * Measures contact resistance for each electrode.
 */
#include <Arduino.h>
#include <Wire.h>
#include "electrode_scan.h"
#include "measurement.h"

void setup() {
  Serial.begin(115200);
  Wire.begin();
  electrode_init();
  measurement_init();
  Serial.println("Electrode Contact Resistance Test");
  Serial.println("elec_index, contact_resistance_ohm, status");
}

void loop() {
  for (int i = 0; i < 32; i++) {
    electrode_select(i, (i + 1) % 32);
    delay(100);
    float v = measurement_readVoltage();
    float c = measurement_readCurrent();
    float r = (c > 0.0001f) ? (v / c) : 9999.0f;
    const char* status = (r < 500.0f) ? "OK" : (r < 2000.0f) ? "MARGINAL" : "HIGH";
    Serial.printf("%d, %.2f, %s\n", i, r, status);
    delay(200);
  }
  Serial.println("--- Scan complete. Repeating in 10s ---");
  delay(10000);
}

/*
 * Voltage Measurement Calibration Sketch
 * Apply known voltages via bench supply; cross-check with DMM.
 */
#include <Arduino.h>
#define PIN_VOLTAGE_POS A0
#define PIN_VOLTAGE_NEG A1
#define VREF 1.1f
#define OVERSAMPLING 64
#define VOLTAGE_DIVIDER_RATIO 10.0f

void setup() {
  Serial.begin(115200);
  analogReference(INTERNAL);
  Serial.println("Voltage Calibration");
  Serial.println("Apply known voltage across electrodes. Reading every 1s.");
  Serial.println("timestamp_ms, raw_pos, raw_neg, measured_V");
}

void loop() {
  long sPos = 0, sNeg = 0;
  for (int i = 0; i < OVERSAMPLING; i++) {
    sPos += analogRead(PIN_VOLTAGE_POS);
    sNeg += analogRead(PIN_VOLTAGE_NEG);
    delayMicroseconds(200);
  }
  float vPos = (sPos / (float)OVERSAMPLING) * (VREF / 1023.0f) * VOLTAGE_DIVIDER_RATIO;
  float vNeg = (sNeg / (float)OVERSAMPLING) * (VREF / 1023.0f) * VOLTAGE_DIVIDER_RATIO;
  Serial.printf("%lu, %.2f, %.2f, %.6f\n", millis(),
    sPos/(float)OVERSAMPLING, sNeg/(float)OVERSAMPLING, vPos - vNeg);
  delay(1000);
}

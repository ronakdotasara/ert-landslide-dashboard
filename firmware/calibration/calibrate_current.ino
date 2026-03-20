/*
 * Current Source Calibration Sketch
 * Connect a precision ammeter in series with the output.
 * Open Serial Monitor at 115200 baud.
 */
#include <Arduino.h>
#define PIN_CURRENT_SENSE A2
#define SHUNT_RESISTANCE_OHM 10.0f
#define VREF 1.1f
#define OVERSAMPLING 64

void setup() {
  Serial.begin(115200);
  analogReference(INTERNAL);
  Serial.println("Current Source Calibration");
  Serial.println("Connect ammeter in series. Reading every 2s.");
  Serial.println("timestamp_ms, raw_adc, calculated_mA");
}

void loop() {
  long sum = 0;
  for (int i = 0; i < OVERSAMPLING; i++) {
    sum += analogRead(PIN_CURRENT_SENSE);
    delay(1);
  }
  float avg  = sum / (float)OVERSAMPLING;
  float volts = avg * (VREF / 1023.0f);
  float mA   = (volts / SHUNT_RESISTANCE_OHM) * 1000.0f;
  Serial.printf("%lu, %.2f, %.4f\n", millis(), avg, mA);
  delay(2000);
}

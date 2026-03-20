#pragma once
#include <Arduino.h>
#include "config.h"

// Analog pins
#define PIN_VOLTAGE_POS  A0
#define PIN_VOLTAGE_NEG  A1
#define PIN_CURRENT_SENSE A2

// Electrode spacing (Wenner array) in meters
#define ELECTRODE_SPACING_M  0.5f

// Geometric factor k for Wenner array
#define WENNER_K  (2.0f * PI * ELECTRODE_SPACING_M)

void measurement_init() {
  analogReference(INTERNAL);  // 1.1V internal reference for precision
  pinMode(PIN_VOLTAGE_POS, INPUT);
  pinMode(PIN_VOLTAGE_NEG, INPUT);
  pinMode(PIN_CURRENT_SENSE, INPUT);
}

float measurement_readVoltage() {
  // Differential voltage measurement with oversampling
  long sumPos = 0, sumNeg = 0;
  for (int i = 0; i < OVERSAMPLING; i++) {
    sumPos += analogRead(PIN_VOLTAGE_POS);
    sumNeg += analogRead(PIN_VOLTAGE_NEG);
    delayMicroseconds(100);
  }
  float vPos = (sumPos / (float)OVERSAMPLING) * (VREF / 1023.0f) * VOLTAGE_DIVIDER_RATIO;
  float vNeg = (sumNeg / (float)OVERSAMPLING) * (VREF / 1023.0f) * VOLTAGE_DIVIDER_RATIO;
  return vPos - vNeg;
}

float measurement_readCurrent() {
  long sum = 0;
  for (int i = 0; i < OVERSAMPLING; i++) {
    sum += analogRead(PIN_CURRENT_SENSE);
    delayMicroseconds(100);
  }
  float rawV = (sum / (float)OVERSAMPLING) * (VREF / 1023.0f);
  return rawV / SHUNT_RESISTANCE_OHM;  // I = V/R (shunt)
}

// Calculate apparent resistivity (Wenner array)
// rho = k * (V / I) [Ohm·m]
float measurement_calcResistivity(float voltage, float current, int elecA, int elecB) {
  if (abs(current) < 0.0001f) return 0.0f;  // avoid div/0
  float resistance = voltage / current;
  // Distance-based geometric factor
  float a = abs(elecB - elecA) * ELECTRODE_SPACING_M;
  float k = 2.0f * PI * a;
  return k * resistance;
}

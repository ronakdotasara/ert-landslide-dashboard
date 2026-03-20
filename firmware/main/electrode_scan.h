#pragma once
#include <Arduino.h>
#include "config.h"

// ADG2188 I2C address (A0=GND, A1=GND)
#define MUX_ADDR_A  0x70
#define MUX_ADDR_B  0x71

void electrode_init() {
  Wire.begin();
  // Set all switches open
  Wire.beginTransmission(MUX_ADDR_A);
  Wire.write(0x00); Wire.write(0xFF);
  Wire.endTransmission();
  Wire.beginTransmission(MUX_ADDR_B);
  Wire.write(0x00); Wire.write(0xFF);
  Wire.endTransmission();
}

// Select a current injection pair (electrodes A and B)
void electrode_select(int elecA, int elecB) {
  // Clear all switches first
  electrode_init();

  uint8_t addrA = (elecA < 16) ? MUX_ADDR_A : MUX_ADDR_B;
  uint8_t addrB = (elecB < 16) ? MUX_ADDR_A : MUX_ADDR_B;
  uint8_t pinA  = elecA % 16;
  uint8_t pinB  = elecB % 16;

  // Close switch for electrode A (current source)
  Wire.beginTransmission(addrA);
  Wire.write(0x01);      // write switch register
  Wire.write(1 << pinA); // enable pin
  Wire.endTransmission();

  // Close switch for electrode B (current sink)
  Wire.beginTransmission(addrB);
  Wire.write(0x01);
  Wire.write(1 << pinB);
  Wire.endTransmission();
}

// Open all switches
void electrode_release_all() {
  electrode_init();
}

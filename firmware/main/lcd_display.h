#pragma once
#include <Arduino.h>
#include <LiquidCrystal.h>

// LCD pins: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(8, 9, 4, 5, 6, 7);

void lcd_init() {
  lcd.begin(16, 2);
  lcd.clear();
}

void lcd_print(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

void lcd_print(const char* line1, String line2) {
  lcd_print(line1, line2.c_str());
}

void lcd_clear() {
  lcd.clear();
}

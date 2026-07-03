/*
  FitPedia Rep Counter — firmware (rep + velocity/tempo + ประหยัดแบต)
  บอร์ด: Seeed XIAO nRF52840 Sense  (nRF52840 + IMU LSM6DS3TR-C + BLE)

  ฟีเจอร์:
   - นับ rep จากการเคลื่อนไหว (state-machine + hysteresis + debounce)
   - (ข) ประเมิน "ความเร็ว (velocity)" + "จังหวะ (tempo)" ต่อ rep — สำหรับ VBT
   - (ค) ประหยัดแบต: ปรับ sample rate ตอนพัก + (ออปชัน) deep sleep ปลุกด้วยการขยับ
   - ส่งค่าออก BLE ให้แอปเติม reps อัตโนมัติ + อ่าน velocity/tempo ได้

  ตั้งค่า Arduino IDE (ยืนยันจาก Seeed wiki + source แล้ว):
   1) Board URL: https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json
   2) Boards Manager: ติดตั้ง "Seeed nRF52 Boards" (ตัวที่ไม่ใช่ mbed — จำเป็นสำหรับ Bluefruit BLE)
      แล้วเลือกบอร์ด "Seeed XIAO nRF52840 Sense"
   3) Library Manager: "Seeed Arduino LSM6DS3"  (BLE ของ Adafruit/Bluefruit มากับ core นี้อยู่แล้ว)
   4) อัปโหลด → Serial Monitor @115200 เพื่อดู/จูน

  ⚠️ หมายเหตุความแม่น (ตามตรง):
   - velocity มาจากการอินทิเกรตความเร่ง → "ประมาณ" (มี drift) เหมาะใช้ "เทียบระหว่าง rep ในเซ็ตเดียวกัน"
     มากกว่าค่าจริงเป๊ะ — ต้องมีการ re-zero ตอนนิ่ง (ทำให้แล้ว) และควรจูนกับของจริง
   - deep sleep: ปลุกจาก System OFF = บอร์ด "รีเซ็ต" (เริ่ม setup() ใหม่ + BLE หลุด) — เปิดใช้เมื่อพร้อม
*/

#include <Adafruit_TinyUSB.h>   // จำเป็นบน core "Seeed nRF52 Boards" ไม่งั้น Serial คอมไพล์ไม่ผ่าน
#include <bluefruit.h>
#include "LSM6DS3.h"
#include "Wire.h"
#include <math.h>

// ---------- ขาเฉพาะของ XIAO nRF52840 Sense (fallback เผื่อ core ไม่ประกาศ macro) ----------
#ifndef PIN_LSM6DS3TR_C_POWER
#define PIN_LSM6DS3TR_C_POWER 15   // P1.08 = สวิตช์จ่ายไฟให้ IMU (ต้องเปิดก่อนใช้!)
#endif
#ifndef PIN_LSM6DS3TR_C_INT1
#define PIN_LSM6DS3TR_C_INT1 18    // P0.11 = ขา INT1 ของ IMU (ใช้ปลุกจาก deep sleep)
#endif

// ---------- IMU ในตัว XIAO nRF52840 Sense (I2C address 0x6A — SA0 ต่อ GND) ----------
LSM6DS3 imu(I2C_MODE, 0x6A);

// ---------- BLE UUID (ฝั่งแอปต้องใช้ตรงกัน) ----------
BLEService        repService("f17e0001-8170-6f5e-4d3c-2b1a8b4c9e21");
BLECharacteristic repChar   ("f17e0002-8170-6f5e-4d3c-2b1a8b4c9e21"); // uint16 reps (read+notify)
BLECharacteristic ctrlChar  ("f17e0003-8170-6f5e-4d3c-2b1a8b4c9e21"); // write 1 byte: 0 = reset
// (ใหม่) เมทริกซ์ 6 ไบต์: reps u16 | peakVel(mm/s) u16 | repDur(ms) u16  — little-endian
BLECharacteristic metChar   ("f17e0004-8170-6f5e-4d3c-2b1a8b4c9e21");

// ---------- ค่าจูนการนับ rep ----------
const float    HIGH_G     = 0.30f;
const float    LOW_G      = 0.12f;
const uint32_t MIN_REP_MS = 800;
const uint32_t REST_MS    = 4000;
const float    EMA_ALPHA  = 0.25f;

// ---------- (ค) ประหยัดแบต ----------
const uint16_t SAMPLE_FAST_MS = 15;    // ~66Hz ตอนเล่น
const uint16_t SAMPLE_SLOW_MS = 160;   // ~6Hz ตอนพัก (ประหยัดขึ้นมาก)
const bool     DEEP_SLEEP_ENABLE = false;   // เปิดเมื่อพร้อม (ปลุกแล้วบอร์ดรีเซ็ต + BLE หลุดชั่วคราว)
const uint32_t DEEP_SLEEP_AFTER_MS = 5UL * 60UL * 1000UL; // นิ่ง 5 นาที -> หลับลึก

// ---------- สถานะ ----------
uint16_t reps = 0;
float    ema = 0.0f;
bool     moving = false;
bool     setDone = false;
uint32_t lastRepMs = 0;
uint32_t lastActiveMs = 0;

// velocity/tempo
float    gB[3] = {0, 0, 1};   // baseline แรงโน้มถ่วง (g) ต่อแกน
float    vel = 0.0f;          // ความเร็วตามแนวดิ่ง (m/s)
float    peakV = 0.0f;        // พีคของ rep ปัจจุบัน
uint32_t repStartMs = 0;
uint32_t lastMicros = 0;
uint16_t lastPeakVel_mmps = 0;
uint16_t lastRepDur_ms = 0;

// ---------- BLE helpers ----------
void notifyAll() {
  repChar.write16(reps);
  repChar.notify16(reps);
  uint8_t buf[6];
  buf[0] = reps & 0xFF;              buf[1] = (reps >> 8) & 0xFF;
  buf[2] = lastPeakVel_mmps & 0xFF;  buf[3] = (lastPeakVel_mmps >> 8) & 0xFF;
  buf[4] = lastRepDur_ms & 0xFF;     buf[5] = (lastRepDur_ms >> 8) & 0xFF;
  metChar.write(buf, 6);
  metChar.notify(buf, 6);
  Serial.print("REP "); Serial.print(reps);
  Serial.print(" | v="); Serial.print(lastPeakVel_mmps); Serial.print("mm/s");
  Serial.print(" | t="); Serial.print(lastRepDur_ms); Serial.println("ms");
}

void onCtrlWrite(uint16_t, BLECharacteristic*, uint8_t* data, uint16_t len) {
  if (len >= 1 && data[0] == 0) {
    reps = 0; setDone = false; lastPeakVel_mmps = 0; lastRepDur_ms = 0;
    notifyAll();
  }
}

void setupBLE() {
  Bluefruit.begin();
  Bluefruit.setName("FitPedia-RepCounter");
  Bluefruit.setTxPower(4);

  repService.begin();

  repChar.setProperties(CHR_PROPS_READ | CHR_PROPS_NOTIFY);
  repChar.setPermission(SECMODE_OPEN, SECMODE_NO_ACCESS);
  repChar.setFixedLen(2);
  repChar.begin(); repChar.write16(0);

  ctrlChar.setProperties(CHR_PROPS_WRITE | CHR_PROPS_WRITE_WO_RESP);
  ctrlChar.setPermission(SECMODE_NO_ACCESS, SECMODE_OPEN);
  ctrlChar.setFixedLen(1);
  ctrlChar.setWriteCallback(onCtrlWrite);
  ctrlChar.begin();

  metChar.setProperties(CHR_PROPS_READ | CHR_PROPS_NOTIFY);
  metChar.setPermission(SECMODE_OPEN, SECMODE_NO_ACCESS);
  metChar.setFixedLen(6);
  metChar.begin();

  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addService(repService);
  Bluefruit.Advertising.addName();
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);
  Bluefruit.Advertising.setFastTimeout(30);
  Bluefruit.Advertising.start(0);
}

// ---------- (ค) deep sleep (ออปชัน — เทสต์กับบอร์ดจริงก่อนเปิด) ----------
void configIMUWakeInterrupt() {
  // ตั้งให้ LSM6DS3TR-C ยิง interrupt เมื่อมีการขยับ (wake-up) ออกที่ INT1
  // อ้างอิง ST AN4650 / datasheet — ยืนยันแล้ว: ต้องเซ็ต bit7 INTERRUPTS_ENABLE ใน TAP_CFG (0x90 = enable+slope)
  imu.writeRegister(0x10, 0x20); // CTRL1_XL: accel 26Hz low-power, ±2g (พอสำหรับตรวจการขยับ — ประหยัด)
  imu.writeRegister(0x58, 0x90); // TAP_CFG: INTERRUPTS_ENABLE(bit7) + SLOPE_FDS(bit4)
  imu.writeRegister(0x5B, 0x02); // WAKE_UP_THS: threshold (ยิ่งน้อยยิ่งไว) — จูนตามงาน
  imu.writeRegister(0x5C, 0x00); // WAKE_UP_DUR: duration
  imu.writeRegister(0x5E, 0x20); // MD1_CFG: route wake-up -> INT1 (bit5 INT1_WU)
}

void enterDeepSleep() {
  Serial.println(">> DEEP SLEEP (ปลุกด้วยการขยับ)"); Serial.flush();
  configIMUWakeInterrupt();
  // INT1 (P0.11 = ขา Arduino 18) ปกติ LOW จะพัลส์ HIGH ตอนขยับ → ตั้ง SENSE เป็น HIGH เพื่อปลุก
  // (ไฟ IMU ที่ขา 15 ยังค้าง HIGH ระหว่าง System OFF จึงยังยิง INT1 ได้)
  pinMode(PIN_LSM6DS3TR_C_INT1, INPUT_PULLDOWN_SENSE);
  delay(5);
  // เข้า System OFF (โหมดประหยัดสุด) — ปลุกด้วย DETECT = บอร์ด "รีเซ็ต" -> เริ่ม setup() ใหม่
  sd_power_system_off();
}

// ---------- setup ----------
void setup() {
  Serial.begin(115200);
  uint32_t t0 = millis();
  while (!Serial && millis() - t0 < 1500) {}

  // ⚠️ สำคัญ: IMU ของ XIAO Sense อยู่บนรางไฟที่มีสวิตช์ — ต้องเปิดไฟก่อน begin() ไม่งั้น I2C อ่านไม่ได้
  pinMode(PIN_LSM6DS3TR_C_POWER, OUTPUT);
  digitalWrite(PIN_LSM6DS3TR_C_POWER, HIGH);
  delay(50); // รอ IMU บูต

  if (imu.begin() != 0) Serial.println("IMU init FAILED");
  else Serial.println("IMU OK");

  setupBLE();
  Serial.println("BLE advertising: 'FitPedia-RepCounter'");

  // อ่านค่าเริ่มเพื่อ set baseline แรงโน้มถ่วง
  gB[0] = imu.readFloatAccelX();
  gB[1] = imu.readFloatAccelY();
  gB[2] = imu.readFloatAccelZ();
  lastActiveMs = millis();
  lastMicros = micros();
}

// ---------- loop ----------
void loop() {
  float ax = imu.readFloatAccelX();
  float ay = imu.readFloatAccelY();
  float az = imu.readFloatAccelZ();

  uint32_t nowUs = micros();
  float dt = (nowUs - lastMicros) / 1e6f;   // วินาที
  if (dt <= 0 || dt > 0.5f) dt = 0.02f;     // กันค่าเพี้ยน
  lastMicros = nowUs;

  float mag = sqrtf(ax*ax + ay*ay + az*az);
  float dyn = fabsf(mag - 1.0f);
  ema = EMA_ALPHA * dyn + (1.0f - EMA_ALPHA) * ema;

  uint32_t now = millis();

  // ----- (ข) velocity: อินทิเกรตความเร่งตามแนว "แรงโน้มถ่วง" (แนวดิ่ง) -----
  // อัปเดต baseline แรงโน้มถ่วงเฉพาะตอนนิ่ง + re-zero velocity (ZUPT) กัน drift
  if (!moving && ema < LOW_G) {
    gB[0] = 0.98f*gB[0] + 0.02f*ax;
    gB[1] = 0.98f*gB[1] + 0.02f*ay;
    gB[2] = 0.98f*gB[2] + 0.02f*az;
    vel = 0.0f;
  } else {
    float gmag = sqrtf(gB[0]*gB[0] + gB[1]*gB[1] + gB[2]*gB[2]);
    if (gmag < 0.1f) gmag = 1.0f;
    // ความเร่งส่วนที่เป็นการเคลื่อนไหว โปรเจกต์ลงแกนแรงโน้มถ่วง (หน่วย g) -> m/s^2
    float accVert = ((ax-gB[0])*gB[0] + (ay-gB[1])*gB[1] + (az-gB[2])*gB[2]) / gmag;
    vel += accVert * 9.81f * dt;
    if (fabsf(vel) > peakV) peakV = fabsf(vel);
  }

  // ----- นับ rep -----
  if (!moving && ema > HIGH_G) {
    moving = true;
    repStartMs = now;
    peakV = 0.0f;
    lastActiveMs = now;
  } else if (moving && ema < LOW_G) {
    moving = false;
    if (now - lastRepMs >= MIN_REP_MS) {
      reps++;
      lastRepMs = now;
      lastActiveMs = now;
      lastPeakVel_mmps = (uint16_t)fminf(65535.0f, peakV * 1000.0f);
      lastRepDur_ms    = (uint16_t)fminf(65535.0f, (float)(now - repStartMs));
      notifyAll();
    }
  }
  if (ema > LOW_G) lastActiveMs = now;

  // ----- จบเซ็ต -----
  uint32_t idle = now - lastActiveMs;
  if (reps > 0 && idle > REST_MS) {
    if (!setDone) { setDone = true; Serial.print(">> SET DONE: "); Serial.print(reps); Serial.println(" reps"); }
  } else if (moving) setDone = false;

  // ----- (ค) deep sleep ตอนนิ่งนานมาก (ออปชัน) -----
  if (DEEP_SLEEP_ENABLE && idle > DEEP_SLEEP_AFTER_MS) {
    enterDeepSleep();  // ปลุกด้วยการขยับ -> บอร์ดรีเซ็ต -> เริ่มโฆษณาใหม่
  }

  // ----- (ค) adaptive sampling: เล่น=ถี่, พัก=ห่าง (ประหยัดแบต) -----
  delay(idle < 1500 ? SAMPLE_FAST_MS : SAMPLE_SLOW_MS);
}

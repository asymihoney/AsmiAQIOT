// ============================================================
// AIR QUALITY MONITOR - FULL SKETCH
// ESP32 + DHT22 + MH-Z19B + PMS7003 + SSD1306 + SD Card + Buzzer
//
// GPIO MAP:
//   DHT22     -> GPIO18
//   MH-Z19B   RX -> GPIO13, TX -> GPIO14
//   PMS7003   RX -> GPIO16, TX -> GPIO17
//   SSD1306   SDA -> GPIO21, SCL -> GPIO22 (default I2C)
//   SD Card   CS -> GPIO27, SCK -> GPIO26, MOSI -> GPIO25, MISO -> GPIO33
//   Buzzer    +  -> GPIO23
// ============================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <HardwareSerial.h>
#include <MHZ19.h>
#include <PMS.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>
#include <time.h>

// ===== WIFI =====
const char* ssid     = " ";
const char* password = " ";

// ===== HIVEMQ =====
const char* mqtt_host  = " ";
const int   mqtt_port  = ;
const char* mqtt_user  = " ";
const char* mqtt_pass  = " ";
const char* mqtt_topic = " ";

// ===== NTP =====
const char* ntp_server     = "pool.ntp.org";
const long  gmt_offset     = 25200;  // UTC+7 (WIB) = 7 * 3600
const int   daylight_offset = 0;

// ===== METADATA =====
// Ubah nilai di bawah sesuai kebutuhan, atau biarkan default "Test"
// Data ini bisa juga dikoreksi via SQL di Supabase setelah upload
String currentSpot    = "Test";   // <-- lokasi pengambilan data
String currentSession = "Test";   // <-- nama sesi
String activityLevel  = "Test";   // <-- kondisi aktivitas

// ===== PIN =====
#define DHTPIN     4
#define DHTTYPE    DHT22
#define MHZ_TX     13
#define MHZ_RX     14
#define PMS_RX     16
#define PMS_TX     17
#define BUZZER_PIN 23

// ===== SD CARD SPI =====
#define SD_CS   27
#define SD_SCK  26
#define SD_MOSI 25
#define SD_MISO 33
SPIClass sdSPI(VSPI);

// ===== OLED =====
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===== OBJECTS =====
DHT dht(DHTPIN, DHTTYPE);
HardwareSerial mhzSerial(2);
HardwareSerial pmsSerial(1);
MHZ19 mhz19;
PMS pms(pmsSerial);
PMS::DATA pmsData;
WiFiClientSecure espClient;
PubSubClient client(espClient);

// ===== STATE =====
bool sdReady       = false;
bool ntpSynced     = false;
bool wifiConnected = false;

// ===== SENSOR DATA =====
float suhu, kelembapan;
int   co2, pm1, pm25, pm10;

// ===== TIMING =====
unsigned long lastRead      = 0;
unsigned long lastReconnect = 0;
#define READ_INTERVAL 5000

// ===== AMBANG BATAS ALARM =====
#define CO2_THRESHOLD  1000
#define PM25_THRESHOLD 150

// ============================================================
// TIMESTAMP
// Mengembalikan string waktu WIB jika NTP sudah sync,
// "unknown" jika belum/gagal (misal WiFi mati saat startup)
// ============================================================
String getTimestamp() {
  if (!ntpSynced) return "unknown";
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

// ============================================================
// WIFI
// Non-blocking attempt: max 10 detik, lanjut offline jika gagal
// ============================================================
bool connectWiFi() {
  Serial.print("Connecting to WiFi");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK! IP: " + WiFi.localIP().toString());
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi OK!");
    display.println(WiFi.localIP().toString());
    display.display();
    delay(1000);
    return true;
  } else {
    Serial.println("\nWiFi GAGAL. Mode offline.");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi GAGAL");
    display.println("Mode: Offline");
    display.display();
    delay(1000);
    return false;
  }
}

// ============================================================
// NTP SYNC
// Dipanggil sekali saat startup, hanya jika WiFi tersedia.
// Setelah sync, getLocalTime() tetap bekerja meski WiFi mati
// karena ESP32 punya RTC internal.
// ============================================================
void syncNTP() {
  if (!wifiConnected) {
    Serial.println("NTP skip: tidak ada WiFi.");
    return;
  }
  Serial.print("Syncing NTP...");
  configTime(gmt_offset, daylight_offset, ntp_server);


  struct tm timeinfo;
  int tries = 0;
  while (!getLocalTime(&timeinfo) && tries < 10) {
    delay(500);
    Serial.print(".");
    tries++;
  }


  if (getLocalTime(&timeinfo)) {
    ntpSynced = true;
    Serial.println(" OK: " + getTimestamp());
  } else {
    Serial.println(" GAGAL.");
  }
}

// ============================================================
// MQTT
// ============================================================
void connectMQTT() {
  if (!wifiConnected) return;

  espClient.setInsecure();
  client.setServer(mqtt_host, mqtt_port);
  client.setBufferSize(512);

  Serial.print("Connecting MQTT...");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting MQTT...");
  display.display();

  String clientId = "ESP32-" + String(random(0xffff), HEX);
  if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
    Serial.println(" MQTT OK!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("MQTT OK!");
    display.display();
    delay(1000);
  } else {
    Serial.print(" MQTT GAGAL, rc=");
    Serial.println(client.state());
  }
}

// ============================================================
// SD CARD
// ============================================================
void initSD() {
  sdSPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  if (!SD.begin(SD_CS, sdSPI, 4000000)) {
    Serial.println("SD Card GAGAL! Cek wiring.");
    sdReady = false;
    return;
  }
  sdReady = true;
  Serial.println("SD Card OK!");

  // Buat file CSV dengan header jika belum ada
  if (!SD.exists("/aqi.csv")) {
    File f = SD.open("/aqi.csv", FILE_WRITE);
    if (f) {
      f.println("timestamp,lokasi,sesi,kondisi,suhu,kelembapan,co2,pm1,pm25,pm10,mqtt_sent");
      f.close();
      Serial.println("CSV header dibuat.");
    }
  }
}


void saveToSD(String timestamp, bool mqttSent) {
  // Jika SD belum siap, coba inisialisasi ulang di sini
  if (!sdReady) {
    Serial.println("Mencoba inisialisasi ulang SD Card...");
    initSD();
    if (!sdReady) return; // Jika masih gagal, keluar
  }

  File f = SD.open("/aqi.csv", FILE_APPEND);
  if (!f) {
    Serial.println("Gagal buka file SD!");
    sdReady = false;
    return;
  }
  sdReady = true;
  f.print(timestamp);      f.print(",");
  f.print(currentSpot);    f.print(",");
  f.print(currentSession); f.print(",");
  f.print(activityLevel);  f.print(",");
  f.print(suhu, 1);        f.print(",");
  f.print(kelembapan, 1);  f.print(",");
  f.print(co2);            f.print(",");
  f.print(pm1);            f.print(",");
  f.print(pm25);           f.print(",");
  f.print(pm10);           f.print(",");
  f.println(mqttSent ? "Yes" : "No");
  f.close();
  Serial.println("Tersimpan ke SD: " + timestamp);
}

// ============================================================
// SENSOR
// ============================================================
void readSensors() {
  suhu       = dht.readTemperature();
  kelembapan = dht.readHumidity();

  if (isnan(suhu) || isnan(kelembapan)) {
    Serial.println("DHT baca gagal! Cek wiring.");
    suhu       = -999;
    kelembapan = -999;
  }

  co2        = mhz19.getCO2();

  pms.requestRead();
  if (pms.readUntil(pmsData, 2000)) {
    pm1  = pmsData.PM_AE_UG_1_0;
    pm25 = pmsData.PM_AE_UG_2_5;
    pm10 = pmsData.PM_AE_UG_10_0;
    Serial.println("PMS OK");
  } else {
    Serial.println("PMS GAGAL - cek wiring!");
  }
}

// ============================================================
// BUZZER
// ============================================================
// Beep singkat 1x: konfirmasi tiap siklus pembacaan (5 detik)
void beepNormal() {
  tone(BUZZER_PIN, 2000, 80);
  delay(100);
  noTone(BUZZER_PIN);
}

// Alarm bahaya
void beepAlarm() {
  for (int i = 0; i < 20; i++) {
    tone(BUZZER_PIN, 3500, 40);
    delay(60);
    noTone(BUZZER_PIN);
    delay(20);
  }
}

void handleBuzzer() {
  if (co2 > CO2_THRESHOLD || pm25 > PM25_THRESHOLD) {
    Serial.println("!!! ALARM: CO2 atau PM2.5 melewati batas bahaya !!!");
    beepAlarm();
  } else {
    beepNormal();
  }
}

// ============================================================
// MQTT PUBLISH
// Hanya dipanggil jika WiFi dan MQTT terhubung
// ============================================================
bool publishMQTT(String timestamp) {
  if (!wifiConnected || !client.connected()) return false;

  StaticJsonDocument<400> doc;
  doc["timestamp"]  = timestamp;
  doc["lokasi"]     = currentSpot;
  doc["sesi"]       = currentSession;
  doc["kondisi"]    = activityLevel;
  doc["suhu"]       = suhu;
  doc["kelembapan"] = kelembapan;
  doc["co2"]        = co2;
  doc["pm1"]        = pm1;
  doc["pm25"]       = pm25;
  doc["pm10"]       = pm10;

  char payload[400];
  serializeJson(doc, payload);

  if (client.publish(mqtt_topic, payload)) {
    Serial.println("MQTT published OK");
    return true;
  } else {
    Serial.println("MQTT publish GAGAL!");
    return false;
  }
}

// ============================================================
// OLED
// Menampilkan: internet status, suhu, kelembapan, co2, pm1/2.5/10
// Warning jika melebihi batas
// ============================================================
void updateOLED() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print("WiFi:");
  display.print(wifiConnected ? "Y" : "N");
  display.print(" SD:");
  display.print(sdReady ? "Y" : "N");
  display.print(" MQTT:");
  display.println(client.connected() ? "Y" : "N");

  display.print("Suhu     : "); display.print(suhu, 1);     display.println(" C");
  display.print("Hum      : "); display.print(kelembapan, 1); display.println(" %");
  display.print("CO2      : "); display.print(co2);         display.println(" ppm");
  display.print("PM1/10   : "); display.print(pm1);
  display.print("/");           display.println(pm10);
  display.print("PM2.5    : "); display.print(pm25);        display.println(" ug/m3");

  if (co2 > CO2_THRESHOLD || pm25 > PM25_THRESHOLD) {
    display.println("!! UDARA BAHAYA !!");
  }

  display.display();
}

// ============================================================
// SERIAL DEBUG
// ============================================================
void printSerial(String timestamp) {
  Serial.println("=============================");
  Serial.print("Timestamp : "); Serial.println(timestamp);
  Serial.print("Internet  : "); Serial.println(wifiConnected ? "Yes" : "No");
  Serial.print("Suhu      : "); Serial.print(suhu, 1); Serial.println(" C");
  Serial.print("Kelembapan: "); Serial.print(kelembapan, 1); Serial.println(" %");
  Serial.print("CO2       : "); Serial.print(co2); Serial.println(" ppm");
  Serial.print("PM1       : "); Serial.println(pm1);
  Serial.print("PM2.5     : "); Serial.println(pm25);
  Serial.print("PM10      : "); Serial.println(pm10);
  Serial.println("=============================");
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(BUZZER_PIN, OUTPUT);

  // --- Sensor init ---
  dht.begin();
  mhzSerial.begin(9600, SERIAL_8N1, MHZ_RX, MHZ_TX);
  mhz19.begin(mhzSerial);
  mhz19.autoCalibration(false);
  pmsSerial.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);

  // --- OLED init ---
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED tidak ditemukan!");
    while (true);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Warming up...");
  display.display();
  delay(3000);

  // --- SD Card ---
  initSD();

  // --- WiFi ---
  wifiConnected = connectWiFi();

  // --- NTP (sekali saat startup) ---
  syncNTP();

  // --- MQTT ---
  connectMQTT();
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  // Update status WiFi secara dinamis tiap iterasi
  wifiConnected = (WiFi.status() == WL_CONNECTED);

  // Reconnect MQTT jika WiFi ada tapi MQTT putus
  if (wifiConnected && !client.connected()) {
    unsigned long now = millis();
    if (now - lastReconnect > 5000) {
      lastReconnect = now;
      connectMQTT();
    }
  }

  if (wifiConnected) client.loop();

  // Siklus pembacaan & upload setiap READ_INTERVAL (5 detik)
  unsigned long now = millis();
  if (now - lastRead >= READ_INTERVAL) {
    lastRead = now;

    String ts = getTimestamp();

    readSensors();
    handleBuzzer();    // beep normal, atau alarm jika bahaya
    printSerial(ts);

    bool sent = false;
    if (wifiConnected) sent = publishMQTT(ts);
    saveToSD(ts, sent);

    updateOLED();
  }
}

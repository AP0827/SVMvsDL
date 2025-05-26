#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid = "F54";                     // Replace with your WiFi
const char* password = "Aayush Pandey";       // Replace with your password
const char* host = "192.168.45.105";         // WSL IP
const uint16_t port = 5002;                   // Python server port

const int xPin = 34;
const int yPin = 35;
const int zPin = 32;

WebSocketsClient webSocket;

unsigned long previousMillis = 0;
const long interval = 20;  // 20 milliseconds = 50Hz

const float V_REF = 3.3;
const float SENSITIVITY = 0.33;  // V/g
const float X_OFFSET = 1.65;
const float Y_OFFSET = 1.65;
const float Z_OFFSET = 1.65;  // or 1.98 if you want z = 0g when flat

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      Serial.println("✅ Connected to WebSocket server");
      break;
    case WStype_DISCONNECTED:
      Serial.println("❌ Disconnected from WebSocket server");
      break;
    case WStype_TEXT:
      Serial.printf("➡  Received: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  Serial.println("📡 ESP32 IP Address: " + WiFi.localIP().toString());

  webSocket.begin(host, port, "/"); // Make sure path is "/"
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();  // keep WebSocket alive and responsive

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    int xRaw = analogRead(xPin);
    int yRaw = analogRead(yPin);
    int zRaw = analogRead(zPin);

    float xVolt = (xRaw / 4095.0) * V_REF;
    float yVolt = (yRaw / 4095.0) * V_REF;
    float zVolt = (zRaw / 4095.0) * V_REF;

    float xG = (xVolt - X_OFFSET) / SENSITIVITY;
    float yG = (yVolt - Y_OFFSET) / SENSITIVITY;
    float zG = (zVolt - Z_OFFSET) / SENSITIVITY;

    float x_ms2 = xG*9.8;
    float y_ms2 = yG*9.8;
    float z_ms2 = zG*9.8;

    // PRESERVED LINE EXACTLY AS REQUESTED:
    String data = "{\"x\":" + String(x_ms2) + ",\"y\":" + String(y_ms2) + ",\"z\":" + String(z_ms2) + ",\"source\":\"live\"}";

    Serial.println("📤 Sending: " + data);
    webSocket.sendTXT(data);
  }
}
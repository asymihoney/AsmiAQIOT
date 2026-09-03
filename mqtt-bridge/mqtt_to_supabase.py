import json
import paho.mqtt.client as mqtt
from supabase import create_client
from datetime import datetime, timezone


# ===== SUPABASE =====
SUPABASE_URL = " "
SUPABASE_KEY = " "
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ===== HIVEMQ =====
MQTT_HOST = " "
MQTT_PORT = 
MQTT_USER = " "
MQTT_PASS = " "
MQTT_TOPIC = " "


# ===== CALLBACKS =====
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("Terhubung ke HiveMQ!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Gagal konek, rc={rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
       
        # SINKRONISASI: Pastikan key sesuai dengan kiriman ESP32
        data = {
            "lokasi":         payload.get("lokasi"),         # Diubah dari spot_name ke lokasi
            "sesi":           payload.get("sesi"),        
            "kondisi":        payload.get("kondisi"),
            "suhu":           payload.get("suhu"),
            "kelembapan":     payload.get("kelembapan"),
            "co2":            payload.get("co2"),
            "pm1":            payload.get("pm1"),
            "pm25":           payload.get("pm25"),
            "pm10":           payload.get("pm10"),
            "created_at":     datetime.now(timezone.utc).isoformat()
        }


        # Simpan ke Supabase
        supabase.table("air_quality").insert(data).execute()
       
        # Print log agar lebih jelas
        print(f"Data {data['lokasi']} ({data['kondisi']}) berhasil disimpan!")


    except Exception as e:
        print(f"Error saat memproses pesan: {e}")


# ===== MAIN RUNNER =====
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.username_pw_set(MQTT_USER, MQTT_PASS)
client.tls_set() # Required for HiveMQ Cloud 8883


client.on_connect = on_connect
client.on_message = on_message


print("Connecting to HiveMQ...")
client.connect(MQTT_HOST, MQTT_PORT, 60)


# loop_forever must be the last thing called
client.loop_forever()



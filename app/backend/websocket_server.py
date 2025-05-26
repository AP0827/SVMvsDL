import asyncio
import websockets
import json
import aiohttp
from datetime import datetime
from statistics import mean
from collections import deque

WINDOW_SIZE = 50
PREDICTION_INTERVAL = 0.2
BUFFER = deque(maxlen=200)

SENSOR_SOURCE = "unknown"
USER_ID = "user_1"
ACTUAL_ACTIVITY = "unknown"

TIME_DELTAS = []
MAX_TIME_SAMPLES = 100

async def send_prediction(window, source, user_id=None, actual_activity=None):
    url = "http://127.0.0.1:5001/api/predict"
    payload = {
        "window": window,
        "source": source,
        "user_id": user_id,
        "actual_activity": actual_activity
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    prediction = await resp.json()
                    print(f"📊 Prediction ({source}):", prediction.get("activity", "N/A"))
                else:
                    text = await resp.text()
                    print(f"[ERROR] Server responded with {resp.status}: {text}")
    except Exception as e:
        print(f"[ERROR] Failed to send prediction: {e}")

async def handler(websocket):
    global SENSOR_SOURCE, USER_ID, ACTUAL_ACTIVITY, TIME_DELTAS
    last_timestamp = None
    print("✅ Client connected")
    try:
        async for message in websocket:
            current_time = datetime.now()
            if last_timestamp:
                delta = (current_time - last_timestamp).total_seconds()
                TIME_DELTAS.append(delta)
                if len(TIME_DELTAS) > MAX_TIME_SAMPLES:
                    TIME_DELTAS.pop(0)
                avg_freq = 1 / mean(TIME_DELTAS)
                print(f"⏱️ Δt: {delta:.3f}s | 📡 Rate: {avg_freq:.2f} Hz")
            last_timestamp = current_time

            try:
                data = json.loads(message)
                x, y, z = data['x'], data['y'], data['z']
                BUFFER.append([x, y, z])
                SENSOR_SOURCE = data.get("source", "unknown")
                USER_ID = data.get("user_id", "user_1")
                ACTUAL_ACTIVITY = data.get("actual_activity", "unknown")
            except Exception as e:
                print(f"[WARN] Invalid message: {e}")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ WebSocket closed: {e}")

async def predictor():
    while True:
        try:
            await asyncio.sleep(PREDICTION_INTERVAL)
            if len(BUFFER) >= WINDOW_SIZE:
                window = list(BUFFER)[-WINDOW_SIZE:]
                print("🧠 Sending prediction window...")
                await send_prediction(window, SENSOR_SOURCE, USER_ID, ACTUAL_ACTIVITY)
        except Exception as e:
            print(f"[ERROR] Predictor exception: {e}")

async def main():
    print("🚀 Starting WebSocket prediction server...")
    async with websockets.serve(handler, "0.0.0.0", 5002):
        print("🌐 Listening on ws://0.0.0.0:5002")
        await asyncio.gather(predictor())

if __name__ == "__main__":
    asyncio.run(main())
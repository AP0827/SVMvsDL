import asyncio
import websockets
import sys
import os
import json
import time

# Ensure parent directory is in the path for module resolution
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

WINDOW_SIZE = 50
SENSOR_DELAY = 0.02

# Get absolute path to the WISDM_raw.txt file relative to this script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(CURRENT_DIR, "WISDM_raw.txt")

def parse_line(line):
    try:
        parts = line.strip().strip(';').split(',')
        return {
            "user_id": parts[0],
            "actual_activity": parts[1],
            "x": float(parts[-3]),
            "y": float(parts[-2]),
            "z": float(parts[-1])
        }
    except Exception as e:
        print(f"[WARN] Skipping line due to parse error: {e}")
        return None

async def simulate():
    try:
        async with websockets.connect("ws://localhost:5002") as websocket:
            print("✅ Simulated connected to WebSocket server")

            with open(file_path, "r") as file:
                for line in file:
                    data = parse_line(line)
                    if data:
                        message = {**data, "source": "simulated"}
                        await websocket.send(json.dumps(message))
                        print(f"📤 Sent: {message}")
                        await asyncio.sleep(SENSOR_DELAY)

            print("✅ Finished sending all sensor data.")
    except Exception as e:
        print(f"[ERROR] Failed to connect or send data: {e}")

if __name__ == "__main__":
    asyncio.run(simulate())
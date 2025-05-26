import asyncio
import websockets

async def handler(websocket):  # path is required by the library, but we will ignore it
    print("✅ ESP32 connected (no path filtering)")
    try:
        async for message in websocket:
            print(f"📥 Received from ESP32: {message}")
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Connection closed: {e}")

async def main():
    print("🚀 Starting server...")
    async with websockets.serve(handler, "0.0.0.0", 5000):  # No path restriction here
        print("🚀 WebSocket server running on ws://0.0.0.0:5000/")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
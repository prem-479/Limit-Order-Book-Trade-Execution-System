import os
import websocket
import json
from database import query

def on_message(ws, message):
    try:
        data = json.loads(message)
        if data.get('type') == 'trade':
            for tick in data['data']:
                query("INSERT INTO markettick (symbol, price) VALUES (%s, %s)", (tick['s'], tick['p']))
                print(f"[Finnhub] Tick recorded: {tick['s']} at {tick['p']}")
        elif data.get('type') == 'ping':
            pass
        else:
            print(f"[Finnhub] Message received: {data.get('type')}")
    except Exception as e:
        print(f"[Finnhub] Error parsing message: {e}")

def on_error(ws, error):
    print(f"[Finnhub] WebSocket error: {error}")

def on_close(ws, close_status_code, close_msg):
    print(f"[Finnhub] Connection closed. Status: {close_status_code}, Message: {close_msg}")

def on_open(ws):
    print("[Finnhub] WebSocket connection established.")
    subscription = json.dumps({"type": "subscribe", "symbol": "BINANCE:BTCUSDT"})
    ws.send(subscription)
    print(f"[Finnhub] Subscribed to BINANCE:BTCUSDT")

def start_feed():
    key = os.getenv("FINNHUB_API_KEY")
    if not key:
        print("[Finnhub] CRITICAL: API Key not found in environment.")
        return
    
    print(f"[Finnhub] Initializing feed with key: {key[:4]}...{key[-4:]}")
    ws = websocket.WebSocketApp(f"wss://ws.finnhub.io?token={key}", 
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()

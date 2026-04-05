from fastapi import APIRouter, WebSocket
import asyncio
from database import query

router = APIRouter()

@router.websocket("/ws/market")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Just grab the absolute latest tick to show signs of life
        data = query("SELECT symbol, price FROM markettick ORDER BY id DESC LIMIT 1")
        if data:
            symbol, price = data[0]
            await websocket.send_text(f"{symbol}: ${float(price):,.2f}")
        
        await asyncio.sleep(0.5)

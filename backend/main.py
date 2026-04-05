from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import websocket
from dotenv import load_dotenv
import finnhub_feed
import threading
import os

load_dotenv()

app = FastAPI(title="LOB_Trade_Execution_System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket.router)

@app.on_event("startup")
async def startup_event():
    print("[Engine] LOB Trade Execution System starting...")
    threading.Thread(target=finnhub_feed.start_feed, daemon=True).start()
    print("[Engine] Background feed active.")

@app.get("/")
async def root():
    return {"status": "online", "engine": "HFT_v2.0"}

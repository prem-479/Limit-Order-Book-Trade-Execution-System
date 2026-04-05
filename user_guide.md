# ── STEP-WISE USER GUIDE ──
## Limit Order Book & Trade Execution System (v2.1)

Welcome to the **LOB Trade Execution System**. This document provides a step-by-step guide on how to operate and understand the high-frequency trading (HFT) interface and its professional Neo-brutalist design system.

---

## 🛠 SECTION 1: SYSTEM ARCHITECTURE
The system is built on a high-concurrency, real-time data pipeline:
1.  **FastAPI Backend**: Handles incoming market data and serves WebSockets.
2.  **Finnhub Feed**: A background thread maintains a dedicated WSS connection to Finnhub for live Binance BTCUSDT ticks.
3.  **Mock Database**: An in-memory, thread-safe storage system for rapid local development.
4.  **React Frontend**: A Vite-powered SPA utilizing state-driven components for low-latency UI updates.

---

## 🚀 SECTION 2: HOW TO START THE SYSTEM

### Step 1: Initialize the Engine (Backend)
Run the following from the `backend/` directory:
```bash
python -m uvicorn main:app --reload --port 8000
```
Verify at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) that the `LOB_Trade_Execution_System` is serving the `/ws/market` endpoint.

### Step 2: Launch the Terminal (Frontend)
Run the following from the `frontend/` directory:
```bash
npm run dev
```
Access the dashboard at [http://localhost:5173/](http://localhost:5173/).

---

## 📊 SECTION 3: OPERATIONAL INTERFACE

### 1. The Header Bar
- **ENGINE STATUS**: Displays `ONLINE` when the WebSocket connection is active.
- **TICK COUNTER**: Shows the total number of market updates received in the current session.

### 2. Market Depth (Order Book)
- **Top Section (Asks)**: Red-tinted levels with cumulative totals and depth visualization bars.
- **Middle (Spread)**: Real-time calculation of the bid-ask spread and percentage.
- **Bottom Section (Bids)**: Green-tinted levels representing local liquidity.

### 3. Trade Tape
- Streams every realized transaction. 
- **Side**: `BUY` (Green) or `SELL` (Red).
- **Manual Trades**: Trades executed by the user will appear here with an instant confirmation.

---

## ⚡ SECTION 4: EXECUTING TRADES

### Step 1: Price and Quantity Entry
In the **Quick Order** panel:
- **Limit Price**: Defaults to the last market price. You can override this manually.
- **Quantity**: Enter the amount in BTC (e.g., `0.5000`).

### Step 2: Execution
- Click the **BUY** or **SELL** button. 
- **Response**: The trade is added to the **Trade Tape**, and an `ORDER_EXECUTED` log is generated in the console.

### Step 3: Algorithm Management
- Click **INITIALIZE ALGO** to engage the automated PPO_ANT_V5 sequence.
- Toggle to **TERMINATOR ALGO** to stop current operations. 

---

## 📝 SECTION 5: SYSTEM LOG CONSOLE
Located at the bottom right, this console tracks vital heartbeat events:
- `GATEWAY_CONNECTED`: Handshake with Finnhub was successful.
- `ORDER_EXECUTED`: Confirms your manual trade parameters.
- `ALGORITHM_INITIALIZED`: Confirms the auto-strategy is now active.

---
## 🎓 SECTION 6: QUICK START EXAMPLE
### Scenario: Executing Your First Manual Buy Order

Follow these exact steps to verify system responsiveness:

1.  **Launch**: Ensure both the backend and frontend are running (see Section 2).
2.  **Observe**: Watch the **Last Price** metric until it stabilizes (e.g., ~$66,992.35).
3.  **Input Price**: In the **Quick Order** panel, the **Limit Price** field will auto-fill with the live market price. Leave it as is for a 'Market-at-Best' simulation.
4.  **Input Quantity**: Click the **Quantity (BTC)** field and type `0.2500`.
5.  **Execute**: Click the **BUY** button.
6.  **Verify Results**:
    -   **Trade Tape**: A new green `BUY` entry should immediately appear at the top.
    -   **System Log Console**: You should see a log: `[TIME] ORDER_EXECUTED: BUY 0.2500 @ 66992.35`.
    -   **Account**: Note that this is a simulation; in a production build, your **Simulated Margin** would update accordingly.

---

> [!TIP]
> **Performance Note**: The Neo-brutalist UI is optimized for high refresh rates. If you experience latency, check the **System Stats** panel to verify if feed latency is under 500ms.

> [!IMPORTANT]
> **Data Source**: This system uses real-time market data from Finnhub but operates in a **Simulated Margin Environment** ($100k test balance). No real capital is used.

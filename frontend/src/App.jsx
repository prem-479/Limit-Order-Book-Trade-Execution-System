import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  BookOpen,
  Clock,
  Star,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import './App.css';

const WS_BASE = "ws://127.0.0.1:8000/ws/market";

/* ────────────────────────────────────────────
   Simulated Order Book Generator
   Builds realistic bid/ask levels around
   the live price from the WebSocket feed.
   ──────────────────────────────────────────── */
function generateOrderBook(midPrice) {
  const asks = [];
  const bids = [];
  const spread = midPrice * 0.0001;

  for (let i = 0; i < 8; i++) {
    const askPrice = midPrice + spread * (i + 1) + Math.random() * 2;
    const bidPrice = midPrice - spread * (i + 1) - Math.random() * 2;
    asks.push({
      price: askPrice.toFixed(2),
      size: (Math.random() * 2 + 0.01).toFixed(4),
      total: (Math.random() * 10 + 0.5).toFixed(4),
    });
    bids.push({
      price: bidPrice.toFixed(2),
      size: (Math.random() * 2 + 0.01).toFixed(4),
      total: (Math.random() * 10 + 0.5).toFixed(4),
    });
  }
  asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  return { asks, bids, spread: (parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(2) };
}


/* ═══════════════════════════════════════════════
   MAIN APPLICATION
   ═══════════════════════════════════════════════ */
export default function App() {
  const [status, setStatus] = useState("CONNECTING");
  const [rawTicks, setRawTicks] = useState([]);
  const [trades, setTrades] = useState([]);
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [], spread: '0.00' });
  const [currentPrice, setCurrentPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [sessionHigh, setSessionHigh] = useState(0);
  const [sessionLow, setSessionLow] = useState(Infinity);
  const [tickCount, setTickCount] = useState(0);

  /* --- NEW DYNAMIC STATE --- */
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [isAlgoActive, setIsAlgoActive] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), msg: "SYSTEM INITIALIZED" },
    { id: 2, time: new Date().toLocaleTimeString(), msg: "WEB_SOCKET_CLIENT_READY" },
  ]);

  const tradeIdRef = useRef(0);
  const logIdRef = useRef(2);

  const addLog = useCallback((msg) => {
    logIdRef.current += 1;
    setLogs(prev => [{ id: logIdRef.current, time: new Date().toLocaleTimeString(), msg: msg.toUpperCase() }, ...prev].slice(0, 15));
  }, []);

  /* --- Trade Handlers --- */
  const handleExecute = (side) => {
    if (!currentPrice) return;
    const price = orderPrice || currentPrice.toFixed(2);
    const qty = orderQty || "0.1000";

    tradeIdRef.current += 1;
    const newTrade = {
      id: `m-${tradeIdRef.current}`,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      symbol: 'BINANCE:BTCUSDT',
      price: parseFloat(price).toFixed(2),
      qty: parseFloat(qty).toFixed(4),
      side: side,
    };

    setTrades(prev => [newTrade, ...prev].slice(0, 40));
    addLog(`ORDER_EXECUTED: ${side} ${qty} @ ${price}`);
  };

  const toggleAlgo = () => {
    const nextState = !isAlgoActive;
    setIsAlgoActive(nextState);
    addLog(nextState ? "ALGORITHM_INITIALIZED: PPO_ANT_V5_STRATEGY" : "ALGORITHM_TERMINATED: MAN_OVERRIDE");
  };

  /* ── WebSocket Connection ── */
  useEffect(() => {
    const ws = new WebSocket(WS_BASE);

    ws.onopen = () => {
      setStatus("ONLINE");
      addLog("GATEWAY_CONNECTED: FINNHUB_WSS");
    };

    ws.onmessage = (event) => {
      const raw = event.data;
      const match = raw.match(/([\w:]+):\s*\$([\d,.]+)/);
      if (!match) return;

      const symbol = match[1];
      const price = parseFloat(match[2].replace(/,/g, ''));
      const timestamp = new Date();

      setPrevPrice((prev) => {
        if (prev === null) setOrderPrice(price.toFixed(2)); // Auto-fill first price
        return price;
      });

      setCurrentPrice((prev) => {
        setPrevPrice(prev);
        return price;
      });

      setSessionHigh((prev) => Math.max(prev, price));
      setSessionLow((prev) => Math.min(prev, price));
      setTickCount((c) => c + 1);

      /* Build a trade record */
      tradeIdRef.current += 1;
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const qty = (Math.random() * 1.5 + 0.001).toFixed(4);

      setTrades((prev) => [
        {
          id: tradeIdRef.current,
          time: timestamp.toLocaleTimeString('en-US', { hour12: false }),
          symbol,
          price: price.toFixed(2),
          qty,
          side,
        },
        ...prev,
      ].slice(0, 40));

      /* Regenerate order book around the price */
      setOrderBook(generateOrderBook(price));
      setRawTicks((prev) => [raw, ...prev].slice(0, 20));
    };

    ws.onerror = () => {
      setStatus("ERROR");
      addLog("CONNECTION_ERROR: GATEWAY_REJECT");
    };

    ws.onclose = () => {
      setStatus("OFFLINE");
      addLog("GATEWAY_DISCONNECTED: RETRY_INIT");
    };

    return () => ws.close();
  }, [addLog]);

  const priceDirection = currentPrice && prevPrice
    ? currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : 'flat'
    : 'flat';

  const maxAskSize = orderBook.asks.length
    ? Math.max(...orderBook.asks.map((a) => parseFloat(a.size)))
    : 1;
  const maxBidSize = orderBook.bids.length
    ? Math.max(...orderBook.bids.map((b) => parseFloat(b.size)))
    : 1;

  return (
    <div className="min-h-screen bg-neo-bg bg-grid relative" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="noise-overlay" />

      {/* ═══ HEADER ═══ */}
      <header className="border-b-4 border-black bg-white relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">

          {/* Logo Block */}
          <div className="flex items-center gap-4">
            <div className="bg-black text-neo-bg px-4 py-2 border-4 border-black" style={{ boxShadow: '4px 4px 0px 0px #FF6B6B' }}>
              <span className="text-base sm:text-lg font-bold tracking-tight uppercase">LOB</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase leading-none">
                Limit Order Book
              </h1>
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-black/60">
                Trade Execution System
              </p>
            </div>
          </div>

          {/* Status + Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="badge-neo badge-neo--live">
              <span className={`status-dot ${status === 'ONLINE' ? 'status-dot--online' : 'status-dot--offline'}`} />
              ENGINE {status}
            </div>
            <div className="badge-neo badge-neo--muted">
              <Clock size={12} strokeWidth={3} className="mr-1" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="badge-neo" style={{ backgroundColor: '#FFFDF5' }}>
              <Zap size={12} strokeWidth={3} className="mr-1" />
              {tickCount} TICKS
            </div>
          </div>
        </div>
      </header>

      {/* ═══ TICKER STRIP ═══ */}
      <div className="ticker-strip">
        <div className="ticker-strip__inner animate-ticker">
          {[...Array(2)].map((_, dupeIdx) => (
            <React.Fragment key={dupeIdx}>
              {['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT', 'COINBASE:BTC-USD', 'KRAKEN:XBTUSD'].map((sym, i) => (
                <React.Fragment key={`${dupeIdx}-${i}`}>
                  <span className="ticker-strip__item">
                    {sym}
                    <span style={{ color: '#FF6B6B' }}>
                      {currentPrice ? `$${(currentPrice + (i * 127.5 * (i % 2 === 0 ? 1 : -1))).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
                    </span>
                  </span>
                  <span className="ticker-strip__separator">/</span>
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══ METRIC CARDS ROW ═══ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="metric-card" style={priceDirection === 'up' ? { borderColor: '#16a34a' } : priceDirection === 'down' ? { borderColor: '#FF6B6B' } : {}}>
            <div className="metric-card__label">Last Price</div>
            <div className="flex items-center gap-2">
              <span className={`metric-card__value ${priceDirection === 'up' ? 'metric-card__value--green' : priceDirection === 'down' ? 'metric-card__value--accent' : ''}`}>
                {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
              </span>
              {priceDirection === 'up' && <TrendingUp size={18} strokeWidth={3} color="#16a34a" />}
              {priceDirection === 'down' && <TrendingDown size={18} strokeWidth={3} color="#FF6B6B" />}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__label">Spread</div>
            <div className="metric-card__value">${orderBook.spread}</div>
          </div>

          <div className="metric-card">
            <div className="metric-card__label">Session High</div>
            <div className="metric-card__value metric-card__value--green">
              {sessionHigh > 0 ? `$${sessionHigh.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card__label">Session Low</div>
            <div className="metric-card__value metric-card__value--accent">
              {sessionLow < Infinity ? `$${sessionLow.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* ─── ORDER BOOK PANEL ─── */}
          <div className="lg:col-span-4 panel">
            <div className="panel__header">
              <BookOpen className="panel__header-icon" />
              Order Book
              <span className="ml-auto badge-neo badge-neo--live" style={{ fontSize: '9px', padding: '1px 6px', border: '2px solid #FFFDF5' }}>
                LIVE
              </span>
            </div>
            <div className="panel__body bg-halftone" style={{ maxHeight: '520px', minHeight: '520px' }}>
              <div className="bg-white">
                <div className="orderbook-row orderbook-row--header">
                  <span>Price (USD)</span>
                  <span style={{ textAlign: 'right' }}>Size (BTC)</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                </div>

                {[...orderBook.asks].reverse().map((ask, i) => (
                  <div key={`ask-${i}`} className="orderbook-row orderbook-row--ask" style={{ position: 'relative' }}>
                    <div className="depth-bar depth-bar--ask" style={{ width: `${(parseFloat(ask.size) / maxAskSize) * 100}%` }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{ask.price}</span>
                    <span style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{ask.size}</span>
                    <span style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{ask.total}</span>
                  </div>
                ))}

                <div className="spread-row">
                  <span>SPREAD</span>
                  <span style={{ textAlign: 'right' }}>${orderBook.spread}</span>
                  <span style={{ textAlign: 'right' }}>
                    {currentPrice ? ((parseFloat(orderBook.spread) / currentPrice) * 100).toFixed(4) + '%' : '---'}
                  </span>
                </div>

                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="orderbook-row orderbook-row--bid" style={{ position: 'relative' }}>
                    <div className="depth-bar depth-bar--bid" style={{ width: `${(parseFloat(bid.size) / maxBidSize) * 100}%` }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{bid.price}</span>
                    <span style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{bid.size}</span>
                    <span style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>{bid.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── TRADE TAPE PANEL ─── */}
          <div className="lg:col-span-5 panel">
            <div className="panel__header">
              <Activity className="panel__header-icon" />
              Trade Tape — Recent Executions
            </div>
            <div className="panel__body bg-halftone" style={{ maxHeight: '520px', minHeight: '520px' }}>
              <div className="bg-white">
                <div className="tape-row tape-row--header">
                  <span>Time</span>
                  <span>Side</span>
                  <span style={{ textAlign: 'right' }}>Price</span>
                  <span style={{ textAlign: 'right' }}>Qty</span>
                </div>

                {trades.length === 0 ? (
                  <div className="p-6 text-center bg-white">
                    <AlertTriangle size={24} strokeWidth={3} className="mx-auto mb-2" />
                    <p className="text-sm font-bold uppercase tracking-wider">Waiting for market data</p>
                  </div>
                ) : (
                  trades.map((t) => (
                    <div key={t.id} className="tape-row bg-white">
                      <span className="text-black/50">{t.time}</span>
                      <span>
                        <span className="badge-neo" style={{
                            padding: '0px 6px',
                            fontSize: '10px',
                            border: '2px solid #000',
                            boxShadow: '1px 1px 0px 0px #000',
                            backgroundColor: t.side === 'BUY' ? '#22c55e' : '#FF6B6B',
                          }}
                        >
                          {t.side}
                        </span>
                      </span>
                      <span style={{ textAlign: 'right', color: t.side === 'BUY' ? '#16a34a' : '#FF6B6B' }}>${t.price}</span>
                      <span style={{ textAlign: 'right' }}>{t.qty}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-5">

            {/* Account Panel */}
            <div className="panel">
              <div className="panel__header" style={{ backgroundColor: '#FFD93D', color: '#000', borderBottom: '4px solid #000' }}>
                <DollarSign className="panel__header-icon" />
                Account
              </div>
              <div className="p-4">
                <div className="metric-card__label">Simulated Margin</div>
                <div className="text-3xl font-bold mt-1 mb-4">$100,000.00</div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="metric-card__label">Open P&L</div>
                    <div className="text-lg font-bold" style={{ color: '#16a34a' }}>+$0.00</div>
                  </div>
                  <div>
                    <div className="metric-card__label">Positions</div>
                    <div className="text-lg font-bold">0</div>
                  </div>
                </div>

                <button
                  onClick={toggleAlgo}
                  className={`btn-neo w-full ${isAlgoActive ? 'btn-neo--primary' : 'btn-neo--execute'}`}
                >
                  <Zap size={14} strokeWidth={3} className={isAlgoActive ? 'animate-pulse' : ''} />
                  {isAlgoActive ? 'Terminator Algo' : 'Initialize Algo'}
                </button>
              </div>
            </div>

            {/* Quick Order Panel */}
            <div className="panel">
              <div className="panel__header" style={{ backgroundColor: '#C4B5FD', color: '#000', borderBottom: '4px solid #000' }}>
                <ArrowRightLeft className="panel__header-icon" />
                Quick Order
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <label className="metric-card__label" htmlFor="order-price">Limit Price</label>
                  <input
                    id="order-price"
                    type="number"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border-4 border-black font-bold text-lg bg-white focus:bg-neo-secondary focus:outline-none transition-colors duration-100"
                  />
                </div>
                <div className="mb-4">
                  <label className="metric-card__label" htmlFor="order-qty">Quantity (BTC)</label>
                  <input
                    id="order-qty"
                    type="number"
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    placeholder="0.1000"
                    className="w-full mt-1 px-3 py-2 border-4 border-black font-bold text-lg bg-white focus:bg-neo-secondary focus:outline-none transition-colors duration-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleExecute('BUY')} className="btn-neo btn-neo--execute w-full">BUY</button>
                  <button onClick={() => handleExecute('SELL')} className="btn-neo btn-neo--primary w-full">SELL</button>
                </div>
              </div>
            </div>

            {/* SYSTEM LOGS PANEL (Fills the gap) */}
            <div className="panel flex-grow">
               <div className="panel__header" style={{ backgroundColor: '#000', color: '#FFFDF5' }}>
                <Clock className="panel__header-icon" />
                System Log Console
              </div>
              <div className="panel__body bg-halftone p-3 font-mono text-[10px] space-y-1" style={{ minHeight: '180px' }}>
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-black/40">[{log.time}]</span>
                    <span className="font-bold text-neo-fg">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <footer className="border-t-4 border-black bg-black text-neo-bg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[0.2em] uppercase">LOB Trade Execution System</span>
            <span className="text-xs text-white/40">v2.1</span>
          </div>
        </div>
      </footer>

      <div className="hidden lg:block fixed animate-spin-slow pointer-events-none" style={{ bottom: '80px', right: '24px', opacity: 0.06 }}>
        <Star size={80} strokeWidth={2} fill="#000" />
      </div>
    </div>
  );
}

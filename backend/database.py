import threading

# Mock storage for market ticks
_ticks = []
_lock = threading.Lock()

def get_connection():
    return True # Mock connection always "active"

def query(sql, params=None):
    global _ticks
    sql_upper = sql.strip().upper()
    
    with _lock:
        if sql_upper.startswith("INSERT INTO MARKETTICK"):
            if params:
                symbol, price = params
                _ticks.append({"symbol": symbol, "price": price})
                if len(_ticks) > 100: # Keep it manageable
                    _ticks.pop(0)
                return True
        
        elif sql_upper.startswith("SELECT SYMBOL, PRICE FROM MARKETTICK"):
            if not _ticks:
                return []
            latest = _ticks[-1]
            return [(latest['symbol'], latest['price'])]
        
        elif sql_upper.startswith("SELECT"):
             return []
             
    return True

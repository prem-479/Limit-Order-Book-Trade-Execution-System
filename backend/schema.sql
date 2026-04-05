-- Limit Order Book & Trade Execution System
-- Production Database Schema
-- Version: 1.1

CREATE DATABASE IF NOT EXISTS hft_trading;
USE hft_trading;

-- Table: users
-- Purpose: Store system users and authentication identifiers.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: markettick
-- Purpose: Real-time ingestion of market price updates.
CREATE TABLE IF NOT EXISTS markettick (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: trade_history
-- Purpose: Audited history of realized trade executions.
CREATE TABLE IF NOT EXISTS trade_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    side VARCHAR(10) CHECK (side IN ('BUY', 'SELL')),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

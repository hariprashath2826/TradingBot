// Import necessary modules
const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

dotenv.config();
const app = express();
app.use(bodyParser.json());

let config = {
    apiKey: process.env.API_KEY || "",
    accessToken: process.env.ACCESS_TOKEN || "",
    clientId: process.env.CLIENT_ID || "",
    initialAmount: 0,
    stopLossPercent: 0,
    takeProfitPercent: 0,
    mode: "live" // live or backtesting
};

let profitLoss = 0;
let currentBalance = config.initialAmount;

// Real-time or Backtest market data simulation
async function getMarketData(symbol, mode = "live") {
    if (mode === "live") {
        const response = await axios.get(`https://api.angelbroking.com/rest/marketdata/${symbol}`, {
            headers: {
                "Authorization": `Bearer ${config.accessToken}`
            }
        });
        return response.data;
    } else {
        // Simulated mock data for backtesting
        return {
            symbol: symbol,
            price: Math.random() * 100 + 100, // Mock price between 100-200
            rsi: Math.random() * 100,        // Mock RSI between 0-100
            trend: Math.random() > 0.5 ? "UP" : "DOWN" // Random trend
        };
    }
}

// Trading Logic
async function executeTrade(symbol, tradeType, price, mode) {
    if (mode === "live") {
        const response = await axios.post('https://api.angelbroking.com/rest/trade', {
            symbol,
            tradeType,
            price
        }, {
            headers: {
                "Authorization": `Bearer ${config.accessToken}`
            }
        });
        return response.data;
    } else {
        console.log(`[BACKTEST] ${tradeType} executed for ${symbol} at ${price}`);
        return { success: true };
    }
}

// Trading Bot Logic
async function startTrading(symbol) {
    const marketData = await getMarketData(symbol, config.mode);

    console.log(`Market Data: ${JSON.stringify(marketData)}`);

    const { price, rsi, trend } = marketData;

    if (rsi < 30 && trend === "DOWN") {
        console.log("BUY condition met.");
        await executeTrade(symbol, "BUY", price, config.mode);
    } else if (rsi > 70 && trend === "UP") {
        console.log("SELL condition met.");
        await executeTrade(symbol, "SELL", price, config.mode);
    }

    // Update profit and loss (for backtesting only)
    if (config.mode === "backtesting") {
        profitLoss += Math.random() * 100 - 50; // Mock P&L calculation
        currentBalance = config.initialAmount + profitLoss;
    }
}

// API Endpoints for Configuration and Controls
app.post('/configure', (req, res) => {
    config = { ...config, ...req.body };
    res.json({ message: "Configuration updated successfully!", config });
});

app.post('/start', async (req, res) => {
    const { symbol } = req.body;
    await startTrading(symbol);
    res.json({ message: "Trading started!" });
});

app.get('/performance', (req, res) => {
    res.json({
        initialAmount: config.initialAmount,
        currentBalance,
        profitLoss
    });
});

app.listen(3000, () => {
    console.log('Trading bot running at http://localhost:3000');
});

# 📈 x402 Market Analysis API

AI-powered cryptocurrency market analysis with x402 micropayments. Get real-time token prices, portfolio analysis, and technical trading signals — all accessible via simple HTTP requests with automatic USDC payments.

[![x402 Protocol](https://img.shields.io/badge/x402-enabled-blue)](https://docs.cdp.coinbase.com/x402)
[![Network](https://img.shields.io/badge/network-Base-0052FF)](https://base.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 What This Does

This service provides three market analysis capabilities that AI agents (or any HTTP client) can pay to use:

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/price` | **$0.001** | Real-time token prices from CoinGecko + DexScreener |
| `GET /api/portfolio/:address` | **$0.005** | Wallet portfolio analysis with diversification scoring |
| `GET /api/signals/:symbol` | **$0.01** | Technical analysis with RSI, MACD, moving averages |

**Live Deployment:** `https://x402-market-analysis.up.railway.app` *(update with your URL)*

---

## 🚀 Quick Start

### Using curl (with test payment)

```bash
# Get ETH price (testnet mode)
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/price?symbol=ETH"

# Analyze a wallet portfolio
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/portfolio/0x1234...?chain=base"

# Get trading signals for SOL
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/signals/SOL"
```

### Using JavaScript (with x402 client)

```javascript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

// Initialize x402 client with your wallet
const client = new x402Client();
registerExactEvmScheme(client, { signer: yourWalletSigner });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Call paid endpoint - payment happens automatically!
const response = await fetchWithPayment(
  'https://your-deployment.com/api/price?symbol=ETH'
);
const data = await response.json();
console.log(data);
// { success: true, data: { symbol: "ETH", price: 3245.67, ... } }
```

### Using Python

```python
import requests

# For testing (accepts any signature)
headers = {"Payment-Signature": "test"}

# Get token price
response = requests.get(
    "https://your-deployment.com/api/price",
    params={"symbol": "BTC"},
    headers=headers
)
print(response.json())

# Portfolio analysis
response = requests.get(
    "https://your-deployment.com/api/portfolio/0x1234567890abcdef...",
    params={"chain": "base"},
    headers=headers
)
print(response.json())
```

---

## 💰 Pricing Table

| Endpoint | Price (USDC) | Use Case |
|----------|-------------|----------|
| Token Price | $0.001 | Quick price checks, bot trading signals |
| Portfolio Analysis | $0.005 | Wallet screening, investment tracking |
| Trading Signals | $0.01 | Technical analysis, trade decisions |

All payments are in **USDC on Base** (mainnet: `eip155:8453`, testnet: `eip155:84532`).

---

## 📡 Endpoints

### 1. Token Price — `GET /api/price`

Get current price and market data for any cryptocurrency.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Either symbol OR contractAddress | Token symbol (BTC, ETH, SOL) |
| `contractAddress` | string | Either symbol OR contractAddress | Token contract address |
| `chain` | string | Required with contractAddress | Blockchain (ethereum, base, arbitrum, polygon, solana) |

**Example Request:**
```bash
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/price?symbol=ETH"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "ETH",
    "name": "Ethereum",
    "price": 3245.67,
    "priceChange24h": 45.23,
    "priceChangePercentage24h": 1.41,
    "marketCap": 389000000000,
    "volume24h": 12500000000,
    "high24h": 3280.00,
    "low24h": 3190.50,
    "ath": 4878.26,
    "athChangePercentage": -33.47,
    "lastUpdated": "2024-01-15T12:30:00.000Z",
    "source": "coingecko"
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### 2. Portfolio Analysis — `GET /api/portfolio/:address`

Analyze wallet holdings with diversification scoring.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Wallet address (0x format) |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain` | string | `base` | Blockchain to analyze |

**Example Request:**
```bash
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/portfolio/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B?chain=ethereum"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    "chain": "ethereum",
    "totalValueUsd": 125000.50,
    "tokenCount": 12,
    "diversificationScore": 72,
    "nativeTokenPercentage": 45.2,
    "stablecoinPercentage": 20.5,
    "topHolding": {
      "symbol": "ETH",
      "name": "Ethereum",
      "valueUsd": 56502.25,
      "percentage": 45.2
    },
    "holdings": [
      {
        "symbol": "ETH",
        "name": "Ethereum",
        "contractAddress": "0x0000000000000000000000000000000000000000",
        "balance": "17.5",
        "balanceFormatted": 17.5,
        "priceUsd": 3228.70,
        "valueUsd": 56502.25,
        "percentage": 45.2
      }
    ],
    "analysisTimestamp": "2024-01-15T12:30:00.000Z"
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### 3. Trading Signals — `GET /api/signals/:symbol`

Generate technical analysis signals with RSI, MACD, moving averages.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `symbol` | string | Token symbol (BTC, ETH, SOL) |

**Example Request:**
```bash
curl -H "Payment-Signature: test" \
  "https://your-deployment.com/api/signals/ETH"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "ETH",
    "currentPrice": 3245.67,
    "overallSignal": "buy",
    "confidence": 72,
    "trend": "bullish",
    "volatility": "medium",
    "supportLevel": 3100.00,
    "resistanceLevel": 3400.00,
    "indicators": [
      {
        "name": "RSI (14)",
        "value": 58.3,
        "signal": "neutral",
        "interpretation": "Neutral momentum"
      },
      {
        "name": "SMA 20",
        "value": 3180.50,
        "signal": "buy",
        "interpretation": "Price above 20-day SMA (bullish)"
      },
      {
        "name": "SMA 50",
        "value": 3050.25,
        "signal": "buy",
        "interpretation": "Price above 50-day SMA (bullish)"
      },
      {
        "name": "MACD",
        "value": 0.015,
        "signal": "buy",
        "interpretation": "MACD histogram positive (bullish momentum)"
      },
      {
        "name": "Volume Trend",
        "value": 0.12,
        "signal": "buy",
        "interpretation": "Volume increasing (confirms trend)"
      }
    ],
    "summary": "ETH: Buy (72% confidence). The bullish trend is supported by 4 bullish and 0 bearish indicators out of 5 analyzed.",
    "generatedAt": "2024-01-15T12:30:00.000Z"
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

---

## 🔐 x402 Payment Integration

### How It Works

1. **Request without payment** → Server returns `402 Payment Required`
2. **Client signs USDC payment** → Using x402 SDK with their wallet
3. **Retry with signature** → Include `Payment-Signature` or `X-Payment` header
4. **Server verifies & responds** → Facilitator settles the payment

### 402 Response Format

When you call a paid endpoint without payment:

```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment via x402 protocol",
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "price": "$0.001",
      "network": "eip155:8453",
      "payTo": "0xede1a30a8b04cca77ecc8d690c552ac7b0d63817"
    }
  ],
  "facilitator": "https://x402.org/facilitator"
}
```

### Using the x402 Client SDK

```javascript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Create wallet client
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

// Set up x402 client
const client = new x402Client();
registerExactEvmScheme(client, { signer: walletClient });

// Wrap fetch with automatic payments
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Now all requests handle 402s automatically
const priceData = await fetchWithPayment(
  'https://your-deployment.com/api/price?symbol=BTC'
).then(r => r.json());

const signals = await fetchWithPayment(
  'https://your-deployment.com/api/signals/ETH'
).then(r => r.json());
```

---

## 🛠️ Self-Hosting

### 1. Clone & Install

```bash
git clone https://github.com/JarchsClaw/x402-market-analysis.git
cd x402-market-analysis
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Your wallet to receive payments
PAY_TO_ADDRESS=0xYourWalletAddress

# Network (testnet for development, mainnet for production)
NETWORK=eip155:84532    # Base Sepolia testnet
# NETWORK=eip155:8453   # Base mainnet

# Facilitator URL
FACILITATOR_URL=https://x402.org/facilitator  # testnet
# FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402  # mainnet

# Optional: API keys for better rate limits
COINGECKO_API_KEY=your-key
```

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 4. Deploy

**Railway:**
```bash
railway init
railway up
```

**Docker:**
```bash
docker build -t x402-market-analysis .
docker run -p 4021:4021 -e PAY_TO_ADDRESS=0x... x402-market-analysis
```

---

## 🔍 Service Discovery

For AI agents and the x402 Bazaar, the service exposes discovery metadata:

```bash
# Get all routes with schemas
curl https://your-deployment.com/x402/discovery

# Health check
curl https://your-deployment.com/health
```

**Discovery Response:**
```json
{
  "x402Version": 2,
  "service": {
    "name": "UPSKILL Market Analysis",
    "description": "AI-powered cryptocurrency market analysis skills",
    "version": "1.0.0",
    "categories": ["crypto", "market-data", "trading", "defi"]
  },
  "routes": [...]
}
```

---

## 📚 Related Documentation

- [API Reference](./API.md) — Complete endpoint documentation
- [Integration Guide](./INTEGRATION.md) — Step-by-step integration tutorial
- [x402 Protocol Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)

---

## 🤝 Part of UPSKILL Ecosystem

This service is designed for the **agent economy** where AI agents can:
- 🔍 Discover services via the Bazaar
- 💸 Pay for capabilities with USDC
- 🔗 Compose skills into complex workflows

---

## 📄 License

MIT — built for the open agent economy.

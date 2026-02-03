# API Reference — x402 Market Analysis

Complete API documentation for all endpoints.

## Base URL

```
Production: https://your-deployment.com
Local:      http://localhost:4021
```

## Authentication

All paid endpoints require x402 payment. Include one of these headers:
- `Payment-Signature: <signature>` 
- `X-Payment: <signature>`

For testing, use `Payment-Signature: test` (only works in testnet mode).

---

## Free Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### Service Info

```http
GET /
```

**Response:**
```json
{
  "name": "UPSKILL Market Analysis",
  "description": "AI-powered cryptocurrency market analysis skills",
  "version": "1.0.0",
  "x402": {
    "enabled": true,
    "facilitator": "https://x402.org/facilitator",
    "network": "eip155:84532",
    "mainnet": false
  },
  "endpoints": [
    {
      "path": "/api/price",
      "method": "GET",
      "price": "$0.001",
      "description": "Token price data"
    },
    {
      "path": "/api/portfolio/:address",
      "method": "GET",
      "price": "$0.005",
      "description": "Wallet portfolio analysis"
    },
    {
      "path": "/api/signals/:symbol",
      "method": "GET",
      "price": "$0.01",
      "description": "Trading signals"
    }
  ]
}
```

### Discovery (Bazaar)

```http
GET /x402/discovery
```

Returns full route configurations with JSON schemas for Bazaar integration.

---

## Paid Endpoints

### Token Price

Get current price and market data for any cryptocurrency.

```http
GET /api/price
```

**Price:** $0.001 USDC

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | One of symbol/contractAddress | Token symbol (e.g., BTC, ETH, SOL) |
| `contractAddress` | string | One of symbol/contractAddress | Token contract address |
| `chain` | string | Required with contractAddress | Blockchain identifier |

**Supported Chains:**
- `ethereum`
- `base`
- `arbitrum`
- `polygon`
- `optimism`
- `avalanche`
- `bsc`
- `solana`

#### Request Examples

**By Symbol:**
```bash
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/price?symbol=ETH"
```

**By Contract Address:**
```bash
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/price?contractAddress=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&chain=base"
```

#### Success Response (200)

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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Token symbol |
| `name` | string | Full token name |
| `price` | number | Current price in USD |
| `priceChange24h` | number | Price change in USD (24h) |
| `priceChangePercentage24h` | number | Price change percentage (24h) |
| `marketCap` | number | Market capitalization in USD |
| `volume24h` | number | 24-hour trading volume in USD |
| `high24h` | number | 24-hour high price |
| `low24h` | number | 24-hour low price |
| `ath` | number | All-time high price |
| `athChangePercentage` | number | Percentage from ATH |
| `lastUpdated` | string | ISO timestamp of last update |
| `source` | string | Data source (`coingecko` or `dexscreener`) |

---

### Portfolio Analysis

Analyze a wallet's token holdings with diversification scoring.

```http
GET /api/portfolio/:address
```

**Price:** $0.005 USDC

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Wallet address (0x format, 42 chars) |

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain` | string | `base` | Blockchain to analyze |

**Supported Chains:**
- `ethereum`
- `base`
- `arbitrum`
- `polygon`
- `optimism`
- `avalanche`
- `bsc`

#### Request Example

```bash
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/portfolio/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B?chain=ethereum"
```

#### Success Response (200)

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
      "contractAddress": "0x0000000000000000000000000000000000000000",
      "balance": "17.5",
      "balanceFormatted": 17.5,
      "decimals": 18,
      "priceUsd": 3228.70,
      "valueUsd": 56502.25,
      "percentage": 45.2
    },
    "holdings": [
      {
        "symbol": "ETH",
        "name": "Ethereum",
        "contractAddress": "0x0000000000000000000000000000000000000000",
        "balance": "17500000000000000000",
        "balanceFormatted": 17.5,
        "decimals": 18,
        "priceUsd": 3228.70,
        "valueUsd": 56502.25,
        "percentage": 45.2
      },
      {
        "symbol": "USDC",
        "name": "USD Coin",
        "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "balance": "25000000000",
        "balanceFormatted": 25000.00,
        "decimals": 6,
        "priceUsd": 1.00,
        "valueUsd": 25000.00,
        "percentage": 20.0
      }
    ],
    "analysisTimestamp": "2024-01-15T12:30:00.000Z"
  },
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `walletAddress` | string | Analyzed wallet address |
| `chain` | string | Blockchain analyzed |
| `totalValueUsd` | number | Total portfolio value in USD |
| `tokenCount` | number | Number of unique tokens held |
| `diversificationScore` | number | 0-100 score (higher = more diversified) |
| `nativeTokenPercentage` | number | Percentage in native token (ETH, MATIC, etc.) |
| `stablecoinPercentage` | number | Percentage in stablecoins |
| `topHolding` | object | Largest holding by value |
| `holdings` | array | All token holdings |
| `analysisTimestamp` | string | ISO timestamp of analysis |

**Diversification Score Interpretation:**
- 0-25: Highly concentrated (risky)
- 26-50: Moderately concentrated
- 51-75: Well diversified
- 76-100: Highly diversified

---

### Trading Signals

Generate technical analysis trading signals.

```http
GET /api/signals/:symbol
```

**Price:** $0.01 USDC

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Token symbol (e.g., BTC, ETH, SOL) |

**Supported Symbols:**
BTC, ETH, SOL, USDC, USDT, LINK, UNI, AAVE, ARB, OP, MATIC, AVAX, DOGE, SHIB, PEPE

#### Request Example

```bash
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/signals/ETH"
```

#### Success Response (200)

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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Analyzed token |
| `currentPrice` | number | Current price in USD |
| `overallSignal` | string | Overall recommendation |
| `confidence` | number | Confidence percentage (0-100) |
| `trend` | string | Market trend direction |
| `volatility` | string | Current volatility level |
| `supportLevel` | number | Technical support price |
| `resistanceLevel` | number | Technical resistance price |
| `indicators` | array | Individual indicator signals |
| `summary` | string | Human-readable summary |
| `generatedAt` | string | ISO timestamp |

**Signal Values:**
- `strong_buy` — Strong bullish signal
- `buy` — Bullish signal
- `neutral` — No clear direction
- `sell` — Bearish signal
- `strong_sell` — Strong bearish signal

**Trend Values:**
- `bullish` — Upward trend
- `bearish` — Downward trend
- `sideways` — No clear trend

**Volatility Values:**
- `low` — Stable price action
- `medium` — Normal volatility
- `high` — Significant price swings

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Either symbol or contractAddress must be provided",
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### 402 Payment Required

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

### 404 Not Found

```json
{
  "success": false,
  "error": "Token 'NOTREAL' not found on CoinGecko",
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to fetch price from CoinGecko: Network timeout",
  "timestamp": "2024-01-15T12:30:00.000Z"
}
```

---

## Error Codes Summary

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Invalid request parameters |
| `402` | Payment required (x402) |
| `404` | Resource not found (e.g., unknown token) |
| `500` | Server error |

---

## Rate Limits

Currently no rate limits are enforced beyond payment requirements. Each paid request costs the specified amount.

In future versions, rate limits may be implemented to prevent abuse, even with valid payments.

---

## Data Sources

| Endpoint | Primary Source | Fallback |
|----------|---------------|----------|
| Token Price (by symbol) | CoinGecko | — |
| Token Price (by contract) | DexScreener | — |
| Portfolio Analysis | Ankr RPC | — |
| Trading Signals | CoinGecko (60-day history) | — |

---

## Versioning

Current API version: **1.0.0**

The API follows semantic versioning. Breaking changes will increment the major version and be announced with deprecation notices.

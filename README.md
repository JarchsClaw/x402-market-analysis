# UPSKILL Market Analysis Skills

x402-enabled market analysis APIs that AI agents can pay to use. Built for the $UPSKILL ecosystem and discoverable via the Coinbase x402 Bazaar.

## 🎯 Features

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/price` | $0.001 | Token price and market data (CoinGecko + DexScreener) |
| `GET /api/portfolio/:address` | $0.005 | Wallet holdings analysis with diversification score |
| `GET /api/signals/:symbol` | $0.01 | Technical analysis trading signals (RSI, MACD, MAs) |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

Key environment variables:
- `PAY_TO_ADDRESS` - Your wallet to receive USDC payments (default: 0xede1a30a8b04cca77ecc8d690c552ac7b0d63817)
- `NETWORK` - `eip155:84532` (Base Sepolia testnet) or `eip155:8453` (Base mainnet)
- `FACILITATOR_URL` - `https://x402.org/facilitator` (testnet) or CDP facilitator (mainnet)

### 3. Run Development Server

```bash
npm run dev
```

### 4. Test Endpoints

```bash
# Health check (free)
curl http://localhost:4021/health

# Token price (returns 402 without payment)
curl http://localhost:4021/api/price?symbol=ETH

# With test payment header
curl -H "Payment-Signature: test" "http://localhost:4021/api/price?symbol=ETH"
```

## 🔐 x402 Payment Flow

1. **Client requests resource** → Server returns `402 Payment Required` with payment instructions
2. **Client signs payment** → Uses x402 client SDK with their wallet
3. **Client retries with signature** → Includes `Payment-Signature` header
4. **Server verifies & returns data** → Facilitator settles USDC payment

### Example 402 Response

```json
{
  "error": "Payment Required",
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "price": "$0.001",
    "network": "eip155:8453",
    "payTo": "0xede1a30a8b04cca77ecc8d690c552ac7b0d63817"
  }],
  "facilitator": "https://x402.org/facilitator"
}
```

## 📡 API Reference

### Token Price

```
GET /api/price?symbol=ETH
GET /api/price?contractAddress=0x...&chain=base
```

**Response:**
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
    "source": "coingecko"
  }
}
```

### Portfolio Analysis

```
GET /api/portfolio/0x1234...5678?chain=base
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x1234...5678",
    "chain": "base",
    "totalValueUsd": 12500.50,
    "tokenCount": 8,
    "diversificationScore": 65,
    "nativeTokenPercentage": 45.2,
    "stablecoinPercentage": 20.5,
    "holdings": [...]
  }
}
```

### Trading Signals

```
GET /api/signals/ETH
```

**Response:**
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
      { "name": "RSI (14)", "value": 58.3, "signal": "neutral" },
      { "name": "SMA 20", "value": 3180.50, "signal": "buy" },
      { "name": "MACD", "value": 0.015, "signal": "buy" }
    ],
    "summary": "ETH: Buy (72% confidence)..."
  }
}
```

## 🌐 Bazaar Discovery

The service exposes discovery metadata at `/x402/discovery` for the Bazaar:

```bash
curl http://localhost:4021/x402/discovery
```

This allows AI agents to discover the service, understand input/output schemas, and integrate programmatically.

## 🚢 Deployment

### Docker

```bash
# Build
docker build -t upskill-market-analysis .

# Run
docker run -p 4021:4021 \
  -e PAY_TO_ADDRESS=0x... \
  -e NETWORK=eip155:8453 \
  upskill-market-analysis
```

### Railway / Render / Fly.io

1. Connect your repo
2. Set environment variables
3. Deploy!

### Production Checklist

- [ ] Set `NETWORK=eip155:8453` for Base mainnet
- [ ] Configure CDP API keys for mainnet facilitator
- [ ] Use `https://api.cdp.coinbase.com/platform/v2/x402` as facilitator
- [ ] Install full x402 SDK: `npm install @x402/express @x402/evm @x402/core`
- [ ] Replace simplified middleware with `@x402/express` payment middleware
- [ ] Add rate limiting and monitoring

## 🤖 For AI Agent Developers

To call these endpoints from your AI agent:

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

// Set up x402 client
const client = new x402Client();
registerExactEvmScheme(client, { signer: yourWalletSigner });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Call paid endpoint - payment happens automatically!
const response = await fetchWithPayment(
  'https://your-deployment.com/api/price?symbol=ETH'
);
const data = await response.json();
```

## 📄 License

MIT

## 🔗 Links

- [x402 Protocol Docs](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)
- [Coinbase Developer Platform](https://cdp.coinbase.com)

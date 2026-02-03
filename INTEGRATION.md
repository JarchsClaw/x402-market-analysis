# Integration Guide — x402 Market Analysis

This guide walks you through integrating the x402 Market Analysis API into your application or AI agent.

## Table of Contents

1. [Understanding x402](#understanding-x402)
2. [Quick Start (Testing)](#quick-start-testing)
3. [Production Integration](#production-integration)
4. [Language Examples](#language-examples)
5. [AI Agent Integration](#ai-agent-integration)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Best Practices](#best-practices)

---

## Understanding x402

x402 is a payment protocol that uses HTTP status code 402 (Payment Required) to enable machine-to-machine micropayments.

### Payment Flow

```
┌─────────┐         ┌─────────┐         ┌─────────────┐
│ Client  │         │  API    │         │ Facilitator │
└────┬────┘         └────┬────┘         └──────┬──────┘
     │                   │                      │
     │  1. GET /api/price?symbol=ETH           │
     │ ────────────────► │                      │
     │                   │                      │
     │  2. 402 Payment Required                │
     │ ◄──────────────── │                      │
     │   (includes price, network, payTo)      │
     │                   │                      │
     │  3. Sign payment with wallet            │
     │ ─ ─ ─ ─ ─ ─ ─ ─ ─►│                      │
     │                   │                      │
     │  4. GET /api/price + Payment-Signature  │
     │ ────────────────► │                      │
     │                   │  5. Verify payment   │
     │                   │ ────────────────────►│
     │                   │                      │
     │                   │  6. Payment valid    │
     │                   │ ◄────────────────────│
     │                   │                      │
     │  7. 200 OK + data │                      │
     │ ◄──────────────── │                      │
```

### Key Concepts

- **402 Response**: Contains payment instructions (price, network, recipient)
- **Payment Signature**: Cryptographic proof of payment intent
- **Facilitator**: Validates and settles payments on-chain
- **USDC on Base**: Payment currency and network

---

## Quick Start (Testing)

For development and testing, you can bypass real payments:

### 1. Test with Mock Signature

```bash
# Add any value as Payment-Signature header
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/price?symbol=ETH"
```

### 2. Use Testnet

Configure the service for Base Sepolia testnet:

```env
NETWORK=eip155:84532
FACILITATOR_URL=https://x402.org/facilitator
```

---

## Production Integration

### Prerequisites

1. **Wallet with USDC on Base**
   - Get USDC on Base mainnet
   - Ensure sufficient balance for API calls
   - Have your private key or wallet signer ready

2. **x402 SDK**
   ```bash
   npm install @x402/fetch @x402/evm @x402/core
   ```

### Step 1: Set Up Your Wallet

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// From environment variable (NEVER hardcode!)
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});
```

### Step 2: Initialize x402 Client

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const client = new x402Client();
registerExactEvmScheme(client, { signer: walletClient });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);
```

### Step 3: Make Paid Requests

```typescript
// Token price ($0.001)
const priceResponse = await fetchWithPayment(
  'https://api.example.com/api/price?symbol=ETH'
);
const priceData = await priceResponse.json();

// Portfolio analysis ($0.005)
const portfolioResponse = await fetchWithPayment(
  'https://api.example.com/api/portfolio/0x1234...5678?chain=base'
);
const portfolioData = await portfolioResponse.json();

// Trading signals ($0.01)
const signalsResponse = await fetchWithPayment(
  'https://api.example.com/api/signals/ETH'
);
const signalsData = await signalsResponse.json();
```

---

## Language Examples

### JavaScript/TypeScript (Full Example)

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const API_URL = 'https://your-deployment.com';

async function main() {
  // Set up wallet
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http()
  });

  // Set up x402
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: walletClient });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  // Get ETH price
  console.log('Fetching ETH price...');
  const priceRes = await fetchWithPayment(`${API_URL}/api/price?symbol=ETH`);
  const priceData = await priceRes.json();
  console.log('ETH Price:', priceData.data.price);

  // Get trading signals
  console.log('Fetching trading signals...');
  const signalsRes = await fetchWithPayment(`${API_URL}/api/signals/ETH`);
  const signalsData = await signalsRes.json();
  console.log('Signal:', signalsData.data.overallSignal);
  console.log('Confidence:', signalsData.data.confidence + '%');
}

main().catch(console.error);
```

### Python (Manual Payment Flow)

```python
import requests
from eth_account import Account
from eth_account.messages import encode_defunct
import json

API_URL = "https://your-deployment.com"
PRIVATE_KEY = "0x..."  # From environment

def get_with_payment(url: str) -> dict:
    """Make a paid request using x402 protocol."""
    
    # Step 1: Initial request (will get 402)
    response = requests.get(url)
    
    if response.status_code != 402:
        return response.json()
    
    # Step 2: Parse payment requirements
    payment_info = response.json()
    accept = payment_info['accepts'][0]
    
    price = accept['price']
    network = accept['network']
    pay_to = accept['payTo']
    
    print(f"Payment required: {price} to {pay_to} on {network}")
    
    # Step 3: Create and sign payment
    # Note: In production, use proper x402 SDK
    # This is simplified for illustration
    account = Account.from_key(PRIVATE_KEY)
    
    payment_message = json.dumps({
        "url": url,
        "price": price,
        "payTo": pay_to,
        "network": network
    })
    
    message = encode_defunct(text=payment_message)
    signature = account.sign_message(message)
    
    # Step 4: Retry with payment signature
    headers = {
        "Payment-Signature": signature.signature.hex()
    }
    
    response = requests.get(url, headers=headers)
    return response.json()

# Usage
if __name__ == "__main__":
    # For testing (mock payment)
    response = requests.get(
        f"{API_URL}/api/price?symbol=ETH",
        headers={"Payment-Signature": "test"}
    )
    print(response.json())
```

### Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const apiURL = "https://your-deployment.com"

func main() {
    // For testing with mock payment
    client := &http.Client{}
    
    req, _ := http.NewRequest("GET", apiURL+"/api/price?symbol=ETH", nil)
    req.Header.Set("Payment-Signature", "test")
    
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    
    var result map[string]interface{}
    json.Unmarshal(body, &result)
    
    fmt.Printf("Response: %+v\n", result)
}
```

---

## AI Agent Integration

### For LangChain Agents

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const fetchWithPayment = /* ... set up as above ... */;

const getTokenPriceTool = new DynamicStructuredTool({
  name: "get_token_price",
  description: "Get the current price of a cryptocurrency token",
  schema: z.object({
    symbol: z.string().describe("Token symbol like BTC, ETH, SOL"),
  }),
  func: async ({ symbol }) => {
    const response = await fetchWithPayment(
      `https://api.example.com/api/price?symbol=${symbol}`
    );
    const data = await response.json();
    return JSON.stringify(data.data);
  },
});

const getTradingSignalsTool = new DynamicStructuredTool({
  name: "get_trading_signals",
  description: "Get technical analysis trading signals for a token",
  schema: z.object({
    symbol: z.string().describe("Token symbol like BTC, ETH, SOL"),
  }),
  func: async ({ symbol }) => {
    const response = await fetchWithPayment(
      `https://api.example.com/api/signals/${symbol}`
    );
    const data = await response.json();
    return JSON.stringify(data.data);
  },
});
```

### For AutoGPT/Agent Frameworks

```python
# As a plugin or skill
class MarketAnalysisSkill:
    def __init__(self, api_url: str, payment_client):
        self.api_url = api_url
        self.client = payment_client
    
    async def get_price(self, symbol: str) -> dict:
        """Get current token price. Costs $0.001."""
        response = await self.client.get(f"{self.api_url}/api/price?symbol={symbol}")
        return response.json()
    
    async def analyze_portfolio(self, address: str, chain: str = "base") -> dict:
        """Analyze wallet portfolio. Costs $0.005."""
        response = await self.client.get(
            f"{self.api_url}/api/portfolio/{address}?chain={chain}"
        )
        return response.json()
    
    async def get_signals(self, symbol: str) -> dict:
        """Get trading signals. Costs $0.01."""
        response = await self.client.get(f"{self.api_url}/api/signals/{symbol}")
        return response.json()
```

### Discovery via Bazaar

AI agents can discover this service programmatically:

```typescript
import { HTTPFacilitatorClient } from '@x402/core/http';
import { withBazaar } from '@x402/extensions/bazaar';

const facilitator = withBazaar(
  new HTTPFacilitatorClient({ 
    url: 'https://api.cdp.coinbase.com/platform/v2/x402' 
  })
);

// Discover market data services
const services = await facilitator.extensions.discovery.listResources({
  type: 'http',
  category: 'market-data',
  tags: ['crypto', 'price'],
});

// Find our service
const marketAnalysis = services.find(s => s.name === 'UPSKILL Market Analysis');
console.log('Available endpoints:', marketAnalysis.endpoints);
```

---

## Common Issues & Solutions

### 1. "Payment Required" keeps returning

**Problem:** You're sending requests without a valid payment signature.

**Solution:**
- For testing: Add `Payment-Signature: test` header
- For production: Use x402 SDK to automatically handle payments

```bash
# Quick test
curl -H "Payment-Signature: test" "http://localhost:4021/api/price?symbol=ETH"
```

### 2. "Insufficient USDC balance"

**Problem:** Your wallet doesn't have enough USDC.

**Solution:**
- Check your USDC balance on Base
- Get more USDC from a DEX or bridge
- For testnet, use Base Sepolia faucet

```bash
# Check balance (using cast from Foundry)
cast balance --erc20 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 YOUR_ADDRESS --rpc-url https://mainnet.base.org
```

### 3. "Token not found"

**Problem:** The symbol isn't recognized by CoinGecko.

**Solution:**
- Use the exact symbol (case-insensitive)
- For newer tokens, use `contractAddress` + `chain` instead of `symbol`

```bash
# Use contract address for less common tokens
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/price?contractAddress=0x...&chain=base"
```

### 4. "Invalid wallet address format"

**Problem:** Portfolio endpoint requires valid 0x address.

**Solution:**
- Ensure address is 42 characters (0x + 40 hex chars)
- Check for typos or extra spaces

```bash
# Correct format
curl -H "Payment-Signature: test" \
  "http://localhost:4021/api/portfolio/0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
```

### 5. "Insufficient price history"

**Problem:** Trading signals require 14+ days of price data.

**Solution:**
- This happens with very new tokens
- Use established tokens for signals
- For new tokens, use price endpoint instead

### 6. Network/RPC Issues

**Problem:** Slow responses or timeouts.

**Solution:**
- Check your internet connection
- The service retries automatically, but may take longer
- Consider self-hosting with your own RPC endpoints

---

## Best Practices

### 1. Cache Where Appropriate

```typescript
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function getCachedPrice(symbol: string) {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetchWithPayment(
    `${API_URL}/api/price?symbol=${symbol}`
  );
  const data = await response.json();
  
  priceCache.set(symbol, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Handle Errors Gracefully

```typescript
async function safeGetSignals(symbol: string) {
  try {
    const response = await fetchWithPayment(
      `${API_URL}/api/signals/${symbol}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

### 3. Monitor Your Spending

```typescript
let totalSpent = 0;
const prices = {
  '/api/price': 0.001,
  '/api/portfolio': 0.005,
  '/api/signals': 0.01,
};

function trackSpending(endpoint: string) {
  for (const [path, price] of Object.entries(prices)) {
    if (endpoint.includes(path)) {
      totalSpent += price;
      console.log(`Total spent: $${totalSpent.toFixed(3)}`);
      break;
    }
  }
}
```

### 4. Use Batch Operations

If you need multiple data points, consider the cost:

```typescript
// Instead of 10 separate price calls ($0.01)
const tokens = ['BTC', 'ETH', 'SOL', ...];

// Make calls in parallel to save time (not money)
const prices = await Promise.all(
  tokens.map(t => fetchWithPayment(`${API_URL}/api/price?symbol=${t}`))
);
```

### 5. Secure Your Private Key

```typescript
// NEVER do this
const privateKey = "0x1234..."; // Bad!

// DO this
const privateKey = process.env.PRIVATE_KEY; // Good
// Or use a secure vault/key management system
```

---

## Support

- **Documentation**: See [API.md](./API.md) for full endpoint reference
- **x402 Protocol**: [docs.cdp.coinbase.com/x402](https://docs.cdp.coinbase.com/x402)
- **Issues**: GitHub Issues on this repo

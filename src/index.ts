import express from 'express';
import { paymentMiddleware } from '@x402/express';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { bazaarResourceServerExtension, declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { config, isMainnet } from './config.js';
import { serviceMetadata } from './routes.js';
import { getTokenPrice } from './services/price.service.js';
import { analyzePortfolio } from './services/portfolio.service.js';
import { generateTradingSignals } from './services/signals.service.js';
import type { ApiResponse } from './types.js';

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Payment-Signature, X-Payment');
  res.header('Access-Control-Expose-Headers', 'Payment-Required, X-Payment-Response');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// =============================================================================
// x402 Setup with Official SDK
// =============================================================================

// Create facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: config.facilitatorUrl,
});

// Create resource server and register extensions
const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);
server.registerExtension(bazaarResourceServerExtension);

// =============================================================================
// Route Configuration with Bazaar Discovery
// =============================================================================

const paymentRoutes = {
  'GET /api/price': {
    accepts: {
      scheme: 'exact' as const,
      price: config.pricing.tokenPrice,
      network: config.network,
      payTo: config.payToAddress,
    },
    extensions: {
      ...declareDiscoveryExtension({
        input: { symbol: 'ETH', chain: 'base' },
        inputSchema: {
          properties: {
            symbol: { type: 'string', description: 'Token symbol (e.g., BTC, ETH, SOL)' },
            contractAddress: { type: 'string', description: 'Token contract address' },
            chain: { type: 'string', description: 'Blockchain (ethereum, base, arbitrum, polygon, solana)' },
          },
        },
        output: {
          example: {
            success: true,
            data: {
              symbol: 'ETH',
              name: 'Ethereum',
              price: 3245.67,
              priceChange24h: 45.23,
              priceChangePercentage24h: 1.41,
              marketCap: 389000000000,
              volume24h: 12500000000,
            },
          },
          schema: {
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  priceChange24h: { type: 'number' },
                  priceChangePercentage24h: { type: 'number' },
                  marketCap: { type: 'number' },
                  volume24h: { type: 'number' },
                },
              },
            },
          },
        },
      }),
    },
  },
  'GET /api/portfolio/:address': {
    accepts: {
      scheme: 'exact' as const,
      price: config.pricing.portfolioAnalysis,
      network: config.network,
      payTo: config.payToAddress,
    },
    extensions: {
      ...declareDiscoveryExtension({
        input: { address: '0x...', chain: 'base' },
        inputSchema: {
          properties: {
            address: { type: 'string', description: 'Wallet address to analyze', pattern: '^0x[a-fA-F0-9]{40}$' },
            chain: { type: 'string', description: 'Blockchain (defaults to base)' },
          },
          required: ['address'],
        },
        output: {
          example: {
            success: true,
            data: {
              walletAddress: '0x1234...5678',
              totalValueUsd: 12500.50,
              tokenCount: 8,
              diversificationScore: 65,
            },
          },
        },
      }),
    },
  },
  'GET /api/signals/:symbol': {
    accepts: {
      scheme: 'exact' as const,
      price: config.pricing.tradingSignals,
      network: config.network,
      payTo: config.payToAddress,
    },
    extensions: {
      ...declareDiscoveryExtension({
        input: { symbol: 'ETH' },
        inputSchema: {
          properties: {
            symbol: { type: 'string', description: 'Token symbol to analyze (e.g., BTC, ETH, SOL)' },
          },
          required: ['symbol'],
        },
        output: {
          example: {
            success: true,
            data: {
              symbol: 'ETH',
              currentPrice: 3245.67,
              overallSignal: 'buy',
              confidence: 72,
              trend: 'bullish',
            },
          },
          schema: {
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  currentPrice: { type: 'number' },
                  overallSignal: { type: 'string', enum: ['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell'] },
                  confidence: { type: 'number' },
                  trend: { type: 'string', enum: ['bullish', 'bearish', 'sideways'] },
                },
              },
            },
          },
        },
      }),
    },
  },
};

// =============================================================================
// Health & Info Endpoints (Free)
// =============================================================================

app.get('/', (req, res) => {
  res.json({
    name: serviceMetadata.name,
    description: serviceMetadata.description,
    version: serviceMetadata.version,
    provider: serviceMetadata.provider,
    x402: {
      enabled: true,
      facilitator: config.facilitatorUrl,
      network: config.network,
      mainnet: isMainnet,
    },
    endpoints: [
      { path: '/api/price', method: 'GET', price: config.pricing.tokenPrice, description: 'Token price data' },
      { path: '/api/portfolio/:address', method: 'GET', price: config.pricing.portfolioAnalysis, description: 'Wallet portfolio analysis' },
      { path: '/api/signals/:symbol', method: 'GET', price: config.pricing.tradingSignals, description: 'Trading signals' },
    ],
    categories: serviceMetadata.categories,
    tags: serviceMetadata.tags,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// =============================================================================
// Paid API Endpoints with Official x402 Middleware
// =============================================================================

// Apply official x402 payment middleware
app.use(paymentMiddleware(paymentRoutes, server));

// Token Price Checker
app.get('/api/price', async (req, res) => {
  try {
    const { symbol, contractAddress, chain } = req.query;
    
    if (!symbol && !contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Either symbol or contractAddress must be provided',
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
    
    const priceData = await getTokenPrice({
      symbol: symbol as string | undefined,
      contractAddress: contractAddress as string | undefined,
      chain: chain as string | undefined,
    });
    
    res.json({
      success: true,
      data: priceData,
      timestamp: new Date().toISOString(),
    } as ApiResponse<typeof priceData>);
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

// Wallet Portfolio Analysis
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain = 'base' } = req.query;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
    
    const portfolio = await analyzePortfolio(address, chain as string);
    
    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    } as ApiResponse<typeof portfolio>);
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

// Trading Signals
app.get('/api/signals/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol || symbol.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid symbol',
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
    
    const signals = await generateTradingSignals(symbol);
    
    res.json({
      success: true,
      data: signals,
      timestamp: new Date().toISOString(),
    } as ApiResponse<typeof signals>);
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     UPSKILL Market Analysis - x402 Official SDK               ║
╠════════════════════════════════════════════════════════════════╣
║  Server:      http://localhost:${config.port}                        ║
║  Network:     ${config.network.padEnd(29)}         ║
║  Mainnet:     ${String(isMainnet).padEnd(29)}         ║
║  Facilitator: ${config.facilitatorUrl.padEnd(28)}║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints (Bazaar Discoverable):                              ║
║    GET /api/price?symbol=ETH          ${config.pricing.tokenPrice.padEnd(9)} per call   ║
║    GET /api/portfolio/:address        ${config.pricing.portfolioAnalysis.padEnd(9)} per call   ║
║    GET /api/signals/:symbol           ${config.pricing.tradingSignals.padEnd(9)} per call   ║
╠════════════════════════════════════════════════════════════════╣
║  Payment Wallet: ${config.payToAddress.slice(0, 20)}...   ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

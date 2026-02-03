import { config } from './config.js';
import type { RouteConfig } from './types.js';

// Bazaar-discoverable route configurations with full schema metadata
export const paymentRoutes: Record<string, RouteConfig> = {
  // Token Price Checker
  'GET /api/price': {
    accepts: [
      {
        scheme: 'exact',
        price: config.pricing.tokenPrice,
        network: config.network,
        payTo: config.payToAddress,
      },
    ],
    description: 'Get current price and market data for any cryptocurrency token. Supports symbols (BTC, ETH) or contract addresses.',
    mimeType: 'application/json',
    extensions: {
      bazaar: {
        info: {
          input: {
            type: 'http',
            method: 'GET',
            queryParams: {
              symbol: 'ETH',
              contractAddress: '0x...',
              chain: 'base',
            },
          },
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Token symbol (e.g., BTC, ETH, SOL). Use this OR contractAddress.',
              },
              contractAddress: {
                type: 'string',
                description: 'Token contract address. Requires chain parameter.',
              },
              chain: {
                type: 'string',
                description: 'Blockchain (ethereum, base, arbitrum, polygon, solana). Required with contractAddress.',
                enum: ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism', 'avalanche', 'bsc', 'solana'],
              },
            },
          },
          output: {
            type: 'json',
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
                high24h: 3280.00,
                low24h: 3190.50,
                ath: 4878.26,
                athChangePercentage: -33.47,
                lastUpdated: '2024-01-15T12:30:00.000Z',
                source: 'coingecko',
              },
            },
          },
          outputSchema: {
            type: 'object',
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
                  high24h: { type: 'number' },
                  low24h: { type: 'number' },
                  ath: { type: 'number' },
                  athChangePercentage: { type: 'number' },
                  lastUpdated: { type: 'string' },
                  source: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },

  // Wallet Portfolio Analysis
  'GET /api/portfolio/:address': {
    accepts: [
      {
        scheme: 'exact',
        price: config.pricing.portfolioAnalysis,
        network: config.network,
        payTo: config.payToAddress,
      },
    ],
    description: 'Analyze a wallet\'s token holdings, portfolio value, diversification score, and allocation breakdown.',
    mimeType: 'application/json',
    extensions: {
      bazaar: {
        info: {
          input: {
            type: 'http',
            method: 'GET',
            pathParams: {
              address: '0x...',
            },
            queryParams: {
              chain: 'base',
            },
          },
          inputSchema: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'Wallet address to analyze (URL path parameter)',
                pattern: '^0x[a-fA-F0-9]{40}$',
              },
              chain: {
                type: 'string',
                description: 'Blockchain to analyze (defaults to base)',
                enum: ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism', 'avalanche', 'bsc'],
                default: 'base',
              },
            },
            required: ['address'],
          },
          output: {
            type: 'json',
            example: {
              success: true,
              data: {
                walletAddress: '0x1234...5678',
                chain: 'base',
                totalValueUsd: 12500.50,
                tokenCount: 8,
                diversificationScore: 65,
                nativeTokenPercentage: 45.2,
                stablecoinPercentage: 20.5,
                topHolding: {
                  symbol: 'ETH',
                  valueUsd: 5650.25,
                  percentage: 45.2,
                },
                holdings: [],
                analysisTimestamp: '2024-01-15T12:30:00.000Z',
              },
            },
          },
        },
      },
    },
  },

  // Trading Signals
  'GET /api/signals/:symbol': {
    accepts: [
      {
        scheme: 'exact',
        price: config.pricing.tradingSignals,
        network: config.network,
        payTo: config.payToAddress,
      },
    ],
    description: 'Generate technical analysis trading signals including RSI, MACD, moving averages, support/resistance levels, and overall recommendation.',
    mimeType: 'application/json',
    extensions: {
      bazaar: {
        info: {
          input: {
            type: 'http',
            method: 'GET',
            pathParams: {
              symbol: 'ETH',
            },
          },
          inputSchema: {
            type: 'object',
            properties: {
              symbol: {
                type: 'string',
                description: 'Token symbol to analyze (e.g., BTC, ETH, SOL)',
              },
            },
            required: ['symbol'],
          },
          output: {
            type: 'json',
            example: {
              success: true,
              data: {
                symbol: 'ETH',
                currentPrice: 3245.67,
                overallSignal: 'buy',
                confidence: 72,
                trend: 'bullish',
                volatility: 'medium',
                supportLevel: 3100.00,
                resistanceLevel: 3400.00,
                indicators: [
                  { name: 'RSI (14)', value: 58.3, signal: 'neutral', interpretation: 'Neutral momentum' },
                  { name: 'SMA 20', value: 3180.50, signal: 'buy', interpretation: 'Price above 20-day SMA (bullish)' },
                  { name: 'MACD', value: 0.015, signal: 'buy', interpretation: 'MACD histogram positive (bullish momentum)' },
                ],
                summary: 'ETH: Buy (72% confidence). The bullish trend is supported by 3 bullish and 1 bearish indicators out of 5 analyzed.',
                generatedAt: '2024-01-15T12:30:00.000Z',
              },
            },
          },
          outputSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  currentPrice: { type: 'number' },
                  overallSignal: {
                    type: 'string',
                    enum: ['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell'],
                  },
                  confidence: { type: 'number', minimum: 0, maximum: 100 },
                  trend: { type: 'string', enum: ['bullish', 'bearish', 'sideways'] },
                  volatility: { type: 'string', enum: ['low', 'medium', 'high'] },
                  supportLevel: { type: 'number' },
                  resistanceLevel: { type: 'number' },
                  indicators: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        value: { type: 'number' },
                        signal: { type: 'string' },
                        interpretation: { type: 'string' },
                      },
                    },
                  },
                  summary: { type: 'string' },
                  generatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Service metadata for the Bazaar
export const serviceMetadata = {
  name: 'UPSKILL Market Analysis',
  description: 'AI-powered cryptocurrency market analysis skills - token prices, portfolio analysis, and trading signals.',
  version: '1.0.0',
  provider: 'UPSKILL Ecosystem',
  contact: 'https://github.com/upskill',
  categories: ['crypto', 'market-data', 'trading', 'defi'],
  tags: ['price', 'portfolio', 'signals', 'technical-analysis', 'ai-agents'],
};

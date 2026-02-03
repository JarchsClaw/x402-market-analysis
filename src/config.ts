import dotenv from 'dotenv';
dotenv.config();

// Network type for x402
type Network = `${string}:${string}`;

// Default to Base mainnet for production
const DEFAULT_NETWORK: Network = 'eip155:8453';

export const config = {
  port: parseInt(process.env.PORT || '4021', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // x402 Configuration
  payToAddress: (process.env.PAY_TO_ADDRESS || '0xede1a30a8b04cca77ecc8d690c552ac7b0d63817') as `0x${string}`,
  facilitatorUrl: process.env.FACILITATOR_URL || 'https://x402.org/facilitator',
  network: (process.env.NETWORK || DEFAULT_NETWORK) as Network,
  
  // Pricing (in USD)
  pricing: {
    tokenPrice: '$0.001',      // Per token price check
    portfolioAnalysis: '$0.005', // Per portfolio analysis
    tradingSignals: '$0.01',   // Per trading signal generation
  },
  
  // External API keys
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  dexscreenerApiKey: process.env.DEXSCREENER_API_KEY,
} as const;

export const isMainnet = config.network === 'eip155:8453';

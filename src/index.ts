import express, { Request, Response, NextFunction } from 'express';
import { config, isMainnet } from './config.js';
import { paymentRoutes, serviceMetadata } from './routes.js';
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
// x402 Payment Middleware
// =============================================================================

/**
 * Simplified x402 payment middleware
 * In production, use @x402/express with full signature verification
 * This implementation shows the payment flow pattern
 */
function x402PaymentMiddleware(routeConfig: typeof paymentRoutes) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Build full path for matching (add /api prefix back since middleware is mounted at /api)
    const fullPath = `/api${req.path}`;
    
    // Find matching route config (handle path params)
    let matchedConfig: typeof routeConfig[string] | undefined;
    for (const [key, cfg] of Object.entries(routeConfig)) {
      const [method, path] = key.split(' ');
      if (method === req.method) {
        // Convert route pattern to regex (handle :param patterns)
        const pathRegex = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$');
        if (pathRegex.test(fullPath)) {
          matchedConfig = cfg;
          break;
        }
      }
    }
    
    if (!matchedConfig) {
      return next();
    }

    // Check for payment signature
    const paymentSignature = req.headers['payment-signature'] || req.headers['x-payment'];
    
    if (!paymentSignature) {
      // Return 402 Payment Required with payment instructions
      res.status(402);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Payment-Required', JSON.stringify({
        x402Version: 2,
        accepts: matchedConfig.accepts,
        description: matchedConfig.description,
        extensions: matchedConfig.extensions,
      }));
      
      return res.json({
        error: 'Payment Required',
        message: 'This endpoint requires payment via x402 protocol',
        x402Version: 2,
        accepts: matchedConfig.accepts,
        description: matchedConfig.description,
        facilitator: config.facilitatorUrl,
        network: config.network,
        extensions: matchedConfig.extensions,
      });
    }

    // In production, verify payment signature with facilitator
    // For now, accept any non-empty signature (testnet behavior)
    // TODO: Implement full verification with @x402/express
    
    console.log(`[x402] Payment received for ${req.method} ${fullPath}`);
    next();
  };
}

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

// Discovery endpoint for Bazaar compatibility
app.get('/x402/discovery', (req, res) => {
  res.json({
    x402Version: 2,
    service: serviceMetadata,
    routes: Object.entries(paymentRoutes).map(([key, cfg]) => ({
      route: key,
      ...cfg,
    })),
  });
});

// =============================================================================
// Paid API Endpoints
// =============================================================================

// Apply x402 middleware to paid routes
app.use('/api', x402PaymentMiddleware(paymentRoutes));

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
║         UPSKILL Market Analysis - x402 Enabled                ║
╠════════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${config.port}                         ║
║  Network:    ${config.network.padEnd(30)}         ║
║  Mainnet:    ${String(isMainnet).padEnd(30)}         ║
║  Facilitator: ${config.facilitatorUrl.padEnd(29)}║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    GET /api/price?symbol=ETH          ${config.pricing.tokenPrice.padEnd(10)} per call   ║
║    GET /api/portfolio/:address        ${config.pricing.portfolioAnalysis.padEnd(10)} per call   ║
║    GET /api/signals/:symbol           ${config.pricing.tradingSignals.padEnd(10)} per call   ║
╠════════════════════════════════════════════════════════════════╣
║  Payment Wallet: ${config.payToAddress.slice(0, 20)}...    ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

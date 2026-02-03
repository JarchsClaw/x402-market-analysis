import axios from 'axios';

export type SignalStrength = 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: SignalStrength;
  interpretation: string;
}

export interface TradingSignal {
  symbol: string;
  currentPrice: number;
  overallSignal: SignalStrength;
  confidence: number; // 0-100
  indicators: TechnicalIndicator[];
  supportLevel: number;
  resistanceLevel: number;
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high';
  summary: string;
  generatedAt: string;
}

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

export async function generateTradingSignals(symbol: string): Promise<TradingSignal> {
  // Fetch historical price data
  const priceHistory = await fetchPriceHistory(symbol);
  
  if (priceHistory.length < 14) {
    throw new Error('Insufficient price history for technical analysis');
  }
  
  const currentPrice = priceHistory[priceHistory.length - 1].price;
  const prices = priceHistory.map(p => p.price);
  const volumes = priceHistory.map(p => p.volume);
  
  // Calculate technical indicators
  const indicators: TechnicalIndicator[] = [];
  
  // RSI (14-period)
  const rsi = calculateRSI(prices, 14);
  indicators.push({
    name: 'RSI (14)',
    value: rsi,
    signal: rsiToSignal(rsi),
    interpretation: rsiInterpretation(rsi),
  });
  
  // Moving Averages
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, Math.min(50, prices.length));
  
  indicators.push({
    name: 'SMA 20',
    value: sma20,
    signal: currentPrice > sma20 ? 'buy' : 'sell',
    interpretation: currentPrice > sma20 
      ? 'Price above 20-day SMA (bullish)' 
      : 'Price below 20-day SMA (bearish)',
  });
  
  indicators.push({
    name: 'SMA 50',
    value: sma50,
    signal: currentPrice > sma50 ? 'buy' : 'sell',
    interpretation: currentPrice > sma50 
      ? 'Price above 50-day SMA (bullish)' 
      : 'Price below 50-day SMA (bearish)',
  });
  
  // MACD
  const macd = calculateMACD(prices);
  indicators.push({
    name: 'MACD',
    value: macd.histogram,
    signal: macdToSignal(macd),
    interpretation: macd.histogram > 0 
      ? 'MACD histogram positive (bullish momentum)' 
      : 'MACD histogram negative (bearish momentum)',
  });
  
  // Volume trend
  const volumeTrend = calculateVolumeTrend(volumes);
  indicators.push({
    name: 'Volume Trend',
    value: volumeTrend,
    signal: volumeTrend > 0 ? 'buy' : volumeTrend < -0.1 ? 'sell' : 'neutral',
    interpretation: volumeTrend > 0.1 
      ? 'Volume increasing (confirms trend)' 
      : volumeTrend < -0.1 
        ? 'Volume decreasing (weakening trend)' 
        : 'Volume stable',
  });
  
  // Calculate support and resistance
  const { support, resistance } = calculateSupportResistance(prices);
  
  // Determine overall signal
  const signalScores = indicators.map(i => signalToScore(i.signal));
  const avgScore = signalScores.reduce((a, b) => a + b, 0) / signalScores.length;
  const overallSignal = scoreToSignal(avgScore);
  
  // Calculate confidence based on indicator agreement
  const signalVariance = calculateVariance(signalScores);
  const confidence = Math.max(0, Math.min(100, 100 - signalVariance * 20));
  
  // Determine trend
  const trend = determineTrend(prices, sma20, sma50);
  
  // Determine volatility
  const volatility = calculateVolatility(prices);
  
  // Generate summary
  const summary = generateSummary(symbol, overallSignal, confidence, trend, indicators);
  
  return {
    symbol: symbol.toUpperCase(),
    currentPrice,
    overallSignal,
    confidence: Math.round(confidence),
    indicators,
    supportLevel: support,
    resistanceLevel: resistance,
    trend,
    volatility,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

async function fetchPriceHistory(symbol: string): Promise<PriceData[]> {
  // Use CoinGecko for historical data
  const coinId = symbolToCoinGeckoId(symbol);
  
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: 60, // 60 days of data
          interval: 'daily',
        },
        timeout: 10000,
      }
    );
    
    const prices = response.data.prices;
    const volumes = response.data.total_volumes;
    
    return prices.map((p: number[], i: number) => ({
      timestamp: p[0],
      price: p[1],
      volume: volumes[i]?.[1] || 0,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch price history: ${error.message}`);
  }
}

function symbolToCoinGeckoId(symbol: string): string {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'PEPE': 'pepe',
  };
  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}

// Technical Analysis Functions

function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;
  
  const changes = prices.slice(-period - 1).map((p, i, arr) => 
    i === 0 ? 0 : p - arr[i - 1]
  ).slice(1);
  
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(Math.abs);
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateEMA(prices: number[], period: number): number {
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA([...prices.slice(0, -9), macd], 9);
  return {
    macd,
    signal,
    histogram: macd - signal,
  };
}

function calculateVolumeTrend(volumes: number[]): number {
  if (volumes.length < 10) return 0;
  const recent = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const previous = volumes.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
  return previous > 0 ? (recent - previous) / previous : 0;
}

function calculateSupportResistance(prices: number[]): { support: number; resistance: number } {
  const sorted = [...prices].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.1)];
  const high = sorted[Math.floor(sorted.length * 0.9)];
  return { support: low, resistance: high };
}

function calculateVolatility(prices: number[]): 'low' | 'medium' | 'high' {
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const variance = calculateVariance(returns);
  const volatility = Math.sqrt(variance) * 100;
  
  if (volatility < 2) return 'low';
  if (volatility < 5) return 'medium';
  return 'high';
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

function determineTrend(prices: number[], sma20: number, sma50: number): 'bullish' | 'bearish' | 'sideways' {
  const current = prices[prices.length - 1];
  const weekAgo = prices[prices.length - 8] || prices[0];
  const priceChange = (current - weekAgo) / weekAgo;
  
  if (current > sma20 && sma20 > sma50 && priceChange > 0.02) return 'bullish';
  if (current < sma20 && sma20 < sma50 && priceChange < -0.02) return 'bearish';
  return 'sideways';
}

// Signal conversion functions

function rsiToSignal(rsi: number): SignalStrength {
  if (rsi < 20) return 'strong_buy';
  if (rsi < 30) return 'buy';
  if (rsi > 80) return 'strong_sell';
  if (rsi > 70) return 'sell';
  return 'neutral';
}

function rsiInterpretation(rsi: number): string {
  if (rsi < 20) return 'Extremely oversold - potential reversal';
  if (rsi < 30) return 'Oversold territory';
  if (rsi > 80) return 'Extremely overbought - potential reversal';
  if (rsi > 70) return 'Overbought territory';
  return 'Neutral momentum';
}

function macdToSignal(macd: { histogram: number; macd: number; signal: number }): SignalStrength {
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    return macd.histogram > 0.01 ? 'strong_buy' : 'buy';
  }
  if (macd.histogram < 0 && macd.macd < macd.signal) {
    return macd.histogram < -0.01 ? 'strong_sell' : 'sell';
  }
  return 'neutral';
}

function signalToScore(signal: SignalStrength): number {
  const scores: Record<SignalStrength, number> = {
    'strong_buy': 2,
    'buy': 1,
    'neutral': 0,
    'sell': -1,
    'strong_sell': -2,
  };
  return scores[signal];
}

function scoreToSignal(score: number): SignalStrength {
  if (score >= 1.5) return 'strong_buy';
  if (score >= 0.5) return 'buy';
  if (score <= -1.5) return 'strong_sell';
  if (score <= -0.5) return 'sell';
  return 'neutral';
}

function generateSummary(
  symbol: string,
  signal: SignalStrength,
  confidence: number,
  trend: string,
  indicators: TechnicalIndicator[]
): string {
  const signalText: Record<SignalStrength, string> = {
    'strong_buy': 'Strong Buy',
    'buy': 'Buy',
    'neutral': 'Hold/Neutral',
    'sell': 'Sell',
    'strong_sell': 'Strong Sell',
  };
  
  const bullishIndicators = indicators.filter(i => 
    i.signal === 'buy' || i.signal === 'strong_buy'
  ).length;
  
  const bearishIndicators = indicators.filter(i => 
    i.signal === 'sell' || i.signal === 'strong_sell'
  ).length;
  
  return `${symbol.toUpperCase()}: ${signalText[signal]} (${confidence}% confidence). ` +
    `The ${trend} trend is supported by ${bullishIndicators} bullish and ` +
    `${bearishIndicators} bearish indicators out of ${indicators.length} analyzed.`;
}

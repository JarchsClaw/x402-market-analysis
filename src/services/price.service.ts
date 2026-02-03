import axios from 'axios';

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercentage: number;
  lastUpdated: string;
  source: string;
}

export interface TokenPriceRequest {
  symbol?: string;
  contractAddress?: string;
  chain?: string;
}

// CoinGecko ID mappings for common tokens
const COINGECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'SOL': 'solana',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'BASE': 'base',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'WIF': 'dogwifhat',
  'BONK': 'bonk',
};

export async function getTokenPrice(request: TokenPriceRequest): Promise<TokenPrice> {
  const { symbol, contractAddress, chain } = request;
  
  // Try DexScreener for contract addresses (better for newer/smaller tokens)
  if (contractAddress && chain) {
    return getTokenPriceFromDexScreener(contractAddress, chain);
  }
  
  // Use CoinGecko for symbols
  if (symbol) {
    return getTokenPriceFromCoinGecko(symbol);
  }
  
  throw new Error('Either symbol or contractAddress+chain must be provided');
}

async function getTokenPriceFromCoinGecko(symbol: string): Promise<TokenPrice> {
  const upperSymbol = symbol.toUpperCase();
  const coinId = COINGECKO_IDS[upperSymbol] || symbol.toLowerCase();
  
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}`,
      {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
        timeout: 10000,
      }
    );
    
    const data = response.data;
    const marketData = data.market_data;
    
    return {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price: marketData.current_price.usd,
      priceChange24h: marketData.price_change_24h || 0,
      priceChangePercentage24h: marketData.price_change_percentage_24h || 0,
      marketCap: marketData.market_cap.usd || 0,
      volume24h: marketData.total_volume.usd || 0,
      high24h: marketData.high_24h.usd || 0,
      low24h: marketData.low_24h.usd || 0,
      ath: marketData.ath.usd || 0,
      athChangePercentage: marketData.ath_change_percentage.usd || 0,
      lastUpdated: marketData.last_updated,
      source: 'coingecko',
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Token '${symbol}' not found on CoinGecko`);
    }
    throw new Error(`Failed to fetch price from CoinGecko: ${error.message}`);
  }
}

async function getTokenPriceFromDexScreener(contractAddress: string, chain: string): Promise<TokenPrice> {
  // Map chain names to DexScreener chain IDs
  const chainMap: Record<string, string> = {
    'ethereum': 'ethereum',
    'eth': 'ethereum',
    'base': 'base',
    'arbitrum': 'arbitrum',
    'arb': 'arbitrum',
    'optimism': 'optimism',
    'op': 'optimism',
    'polygon': 'polygon',
    'matic': 'polygon',
    'solana': 'solana',
    'sol': 'solana',
    'bsc': 'bsc',
    'bnb': 'bsc',
    'avalanche': 'avalanche',
    'avax': 'avalanche',
  };
  
  const dexChain = chainMap[chain.toLowerCase()] || chain.toLowerCase();
  
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`,
      { timeout: 10000 }
    );
    
    const pairs = response.data.pairs;
    if (!pairs || pairs.length === 0) {
      throw new Error(`No trading pairs found for contract ${contractAddress}`);
    }
    
    // Find the pair on the specified chain with highest liquidity
    const chainPairs = pairs.filter((p: any) => p.chainId === dexChain);
    const pair = chainPairs.length > 0 
      ? chainPairs.reduce((a: any, b: any) => 
          (a.liquidity?.usd || 0) > (b.liquidity?.usd || 0) ? a : b)
      : pairs[0];
    
    const priceChange = pair.priceChange || {};
    
    return {
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      price: parseFloat(pair.priceUsd) || 0,
      priceChange24h: (parseFloat(pair.priceUsd) * (priceChange.h24 || 0) / 100) || 0,
      priceChangePercentage24h: priceChange.h24 || 0,
      marketCap: pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      high24h: 0, // Not available from DexScreener
      low24h: 0,  // Not available from DexScreener
      ath: 0,     // Not available from DexScreener
      athChangePercentage: 0,
      lastUpdated: new Date().toISOString(),
      source: 'dexscreener',
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch price from DexScreener: ${error.message}`);
  }
}

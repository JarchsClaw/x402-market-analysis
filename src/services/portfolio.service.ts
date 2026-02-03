import axios from 'axios';

export interface TokenHolding {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  balanceFormatted: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
  percentage: number;
}

export interface PortfolioAnalysis {
  walletAddress: string;
  chain: string;
  totalValueUsd: number;
  tokenCount: number;
  holdings: TokenHolding[];
  topHolding: TokenHolding | null;
  diversificationScore: number; // 0-100, higher = more diversified
  nativeTokenPercentage: number;
  stablecoinPercentage: number;
  analysisTimestamp: string;
}

// Stablecoin addresses by chain
const STABLECOINS: Record<string, string[]> = {
  'ethereum': [
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  ],
  'base': [
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
    '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', // DAI
  ],
  'arbitrum': [
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
  ],
};

// Native token symbols by chain
const NATIVE_TOKENS: Record<string, string> = {
  'ethereum': 'ETH',
  'base': 'ETH',
  'arbitrum': 'ETH',
  'polygon': 'MATIC',
  'avalanche': 'AVAX',
  'bsc': 'BNB',
  'solana': 'SOL',
};

export async function analyzePortfolio(
  walletAddress: string, 
  chain: string = 'base'
): Promise<PortfolioAnalysis> {
  // Use Alchemy or similar API for token balances
  // For now, using a free alternative approach
  const holdings = await getWalletTokens(walletAddress, chain);
  
  const totalValueUsd = holdings.reduce((sum, h) => sum + h.valueUsd, 0);
  
  // Calculate percentages
  const holdingsWithPercentage = holdings.map(h => ({
    ...h,
    percentage: totalValueUsd > 0 ? (h.valueUsd / totalValueUsd) * 100 : 0,
  }));
  
  // Sort by value
  holdingsWithPercentage.sort((a, b) => b.valueUsd - a.valueUsd);
  
  // Calculate diversification score (using Herfindahl-Hirschman Index inverted)
  const hhi = holdingsWithPercentage.reduce((sum, h) => sum + Math.pow(h.percentage, 2), 0);
  const diversificationScore = Math.min(100, Math.max(0, 100 - (hhi / 100)));
  
  // Calculate stablecoin percentage
  const chainStables = STABLECOINS[chain.toLowerCase()] || [];
  const stablecoinValue = holdingsWithPercentage
    .filter(h => chainStables.includes(h.contractAddress.toLowerCase()) || 
                 ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'].includes(h.symbol.toUpperCase()))
    .reduce((sum, h) => sum + h.valueUsd, 0);
  const stablecoinPercentage = totalValueUsd > 0 ? (stablecoinValue / totalValueUsd) * 100 : 0;
  
  // Calculate native token percentage
  const nativeSymbol = NATIVE_TOKENS[chain.toLowerCase()] || 'ETH';
  const nativeValue = holdingsWithPercentage
    .filter(h => h.symbol.toUpperCase() === nativeSymbol)
    .reduce((sum, h) => sum + h.valueUsd, 0);
  const nativeTokenPercentage = totalValueUsd > 0 ? (nativeValue / totalValueUsd) * 100 : 0;
  
  return {
    walletAddress,
    chain,
    totalValueUsd,
    tokenCount: holdingsWithPercentage.length,
    holdings: holdingsWithPercentage,
    topHolding: holdingsWithPercentage[0] || null,
    diversificationScore,
    nativeTokenPercentage,
    stablecoinPercentage,
    analysisTimestamp: new Date().toISOString(),
  };
}

async function getWalletTokens(walletAddress: string, chain: string): Promise<TokenHolding[]> {
  // Using DeBank-like approach via public APIs
  // In production, use Alchemy, Moralis, or similar
  
  const chainToId: Record<string, string> = {
    'ethereum': 'eth',
    'base': 'base',
    'arbitrum': 'arb',
    'polygon': 'matic',
    'optimism': 'op',
    'avalanche': 'avax',
    'bsc': 'bsc',
  };
  
  const chainId = chainToId[chain.toLowerCase()] || chain;
  
  try {
    // Try using Ankr's free token balance API
    const response = await axios.post(
      'https://rpc.ankr.com/multichain',
      {
        jsonrpc: '2.0',
        method: 'ankr_getAccountBalance',
        params: {
          blockchain: [chainId],
          walletAddress: walletAddress,
        },
        id: 1,
      },
      { timeout: 15000 }
    );
    
    const assets = response.data.result?.assets || [];
    
    return assets.map((asset: any) => ({
      symbol: asset.tokenSymbol || 'UNKNOWN',
      name: asset.tokenName || asset.tokenSymbol || 'Unknown Token',
      contractAddress: asset.contractAddress || '0x0000000000000000000000000000000000000000',
      balance: asset.balance || '0',
      balanceFormatted: parseFloat(asset.balanceRawInteger || '0') / Math.pow(10, asset.tokenDecimals || 18),
      decimals: asset.tokenDecimals || 18,
      priceUsd: parseFloat(asset.tokenPrice || '0'),
      valueUsd: parseFloat(asset.balanceUsd || '0'),
      percentage: 0, // Will be calculated later
    }));
  } catch (error: any) {
    // Fallback: return empty with error message
    console.error('Failed to fetch wallet tokens:', error.message);
    
    // Try a simpler approach using DexScreener for the wallet
    return [];
  }
}

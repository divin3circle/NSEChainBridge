import { MyTokens, MyStocks } from "../../constants/Data";

// Types based on backend API responses
interface BackendToken {
  tokenId: string;
  symbol: string;
  name: string;
  stockCode: string;
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  treasuryAccountId: string;
  metadata: {
    description: string;
    stockPrice: number;
    marketCap: number;
    peRatio?: number;
    volume24h?: number;
    yearHigh?: number;
    yearLow?: number;
    dividend?: number;
  };
}

interface BackendTokenBalance {
  tokenId: string;
  symbol: string;
  name: string;
  balance: number;
  stockCode: string | null;
  decimals: number;
  metadata: any;
}

interface BackendUser {
  _id: string;
  name: string;
  email: string;
  hederaAccountId: string;
  stockHoldings: Array<{
    stockCode: string;
    quantity: number;
    lockedQuantity: number;
  }>;
  tokenHoldings: Array<{
    tokenId: string;
    balance: number;
  }>;
}

// Default images for tokens to match frontend expectations
const TOKEN_IMAGES: Record<string, any> = {
  KCB: require("../assets/images/kcb.png"),
  EQTY: require("../assets/images/eqty.png"),
  SCOM: require("../assets/images/safaricom.png"),
  EABL: require("../assets/images/eabl.webp"),
  HBAR: require("../assets/images/hbar.svg"),
  KSH: require("../assets/images/ksh.svg"),
  // Add more as needed
};

// Default graphs for tokens
const TOKEN_GRAPHS: Record<string, any> = {
  KCB: require("../assets/images/kcb.svg"),
  EQTY: require("../assets/images/eqty.svg"),
  SCOM: require("../assets/images/scom.svg"),
  EABL: require("../assets/images/eabl.svg"),
  // Add more as needed
};

/**
 * Convert backend token data to frontend MyTokens format
 */
export function adaptTokensToFrontendFormat(
  tokens: BackendToken[],
  balances: BackendTokenBalance[]
): MyTokens[] {
  return balances.map((balance) => {
    const token = tokens.find((t) => t.tokenId === balance.tokenId) || {
      symbol: balance.symbol,
      name: balance.name,
      metadata: balance.metadata,
    };

    // Default values in case the backend doesn't provide them
    const defaultValues = {
      low_12min: 0,
      high_12min: 0,
      dayLow: 0,
      dayHigh: 0,
      dayPrice: token.metadata?.stockPrice || 0,
      previous: 0,
      change: 0,
      changePercentage: 0,
      volume: token.metadata?.volume24h || 0,
      adjust: 0,
      date: new Date().toISOString().split("T")[0],
    };

    return {
      image: TOKEN_IMAGES[token.symbol] || TOKEN_IMAGES.KSH, // Default to KSH if no match
      code: token.symbol,
      name: token.name,
      stockBlanace: balance.balance,
      kesBalance: 0, // This would need to come from somewhere else
      moverGraph: TOKEN_GRAPHS[token.symbol] || TOKEN_GRAPHS.KCB, // Default graph
      ...defaultValues,
    } as MyTokens;
  });
}

/**
 * Convert backend stock holdings to frontend MyStocks format
 */
export function adaptStocksToFrontendFormat(
  user: BackendUser,
  tokens: BackendToken[]
): MyStocks[] {
  return user.stockHoldings.map((holding) => {
    const token = tokens.find((t) => t.stockCode === holding.stockCode);

    // Default values
    const defaultValues = {
      low_12min: 0,
      high_12min: 0,
      dayLow: 0,
      dayHigh: 0,
      dayPrice: token?.metadata?.stockPrice || 0,
      previous: 0,
      change: 0,
      changePercentage: 0,
      volume: token?.metadata?.volume24h || 0,
      adjust: 0,
      date: new Date().toISOString().split("T")[0],
    };

    return {
      image: TOKEN_IMAGES[holding.stockCode] || TOKEN_IMAGES.KCB,
      code: holding.stockCode,
      name: token?.name || `${holding.stockCode} Stock`,
      stockBlanace: holding.quantity,
      kesBalance: 0,
      moverGraph: TOKEN_GRAPHS[holding.stockCode] || TOKEN_GRAPHS.KCB,
      ...defaultValues,
    } as MyStocks;
  });
}

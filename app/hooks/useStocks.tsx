import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  API_BASE_URL,
  MyStocks,
  MyTokens,
  myStocks,
  myTokens,
  stockStats,
} from "../../constants/Data";

// Define a custom type that includes tokenId
interface EnhancedMyTokens extends MyTokens {
  tokenId: string;
}

// Types for backend responses
interface BackendUser {
  id: string;
  name: string;
  email: string;
  hederaAccountId?: string;
  stockHoldings?: {
    stockCode: string;
    quantity: number;
  }[];
  tokenHoldings?: {
    tokenId: string;
    balance: number;
  }[];
  tokens?: {
    tokenId: string;
    symbol: string;
    name: string;
    balance: number;
    stockCode: string | null;
  }[];
}

interface MeResponse {
  user: BackendUser;
}

export function useStocks() {
  const queryClient = useQueryClient();

  // Fetch user profile and holdings
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async (): Promise<{
      user: BackendUser;
      userStocks: MyStocks[];
      userTokens: EnhancedMyTokens[];
    }> => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const { user }: MeResponse = await response.json();

      const userStocks: MyStocks[] = [];

      if (user.stockHoldings && user.stockHoldings.length > 0) {
        user.stockHoldings.forEach((holding) => {
          const stockData = myStocks.find(
            (stock) => stock.code === holding.stockCode
          );

          if (stockData) {
            userStocks.push({
              ...stockData,
              stockBlanace: holding.quantity,
            });
          }
        });
      }

      // Map backend token holdings to frontend format
      const userTokens: EnhancedMyTokens[] = [];

      if (user.tokens && user.tokens.length > 0) {
        user.tokens.forEach((token) => {
          // Find corresponding token in frontend data
          let tokenData = myTokens.find((t) => t.code === token.symbol);

          // If token is related to a stock, use stock data
          if (token.stockCode) {
            const stockData = myStocks.find(
              (stock) => stock.code === token.stockCode
            );

            if (stockData && tokenData) {
              userTokens.push({
                ...tokenData,
                stockBlanace: token.balance,
                // Add token ID from backend to our frontend structure
                tokenId: token.tokenId,
              } as EnhancedMyTokens);
            } else if (stockData) {
              // If we have stock data but no matching token in frontend data
              userTokens.push({
                ...stockData,
                stockBlanace: token.balance,
                tokenId: token.tokenId,
              } as EnhancedMyTokens);
            }
          } else if (tokenData) {
            // For non-stock tokens like HBAR or KSH
            userTokens.push({
              ...tokenData,
              stockBlanace: token.balance,
              tokenId: token.tokenId,
            } as EnhancedMyTokens);
          } else {
            // For tokens that don't match any in our frontend data
            // Create minimal representation with proper types
            userTokens.push({
              code: token.symbol,
              name: token.name,
              image: require("../../assets/images/token-placeholder.png"),
              stockBlanace: token.balance,
              tokenId: token.tokenId,
              dayPrice: 0,
              // Add required properties with default values
              low_12min: 0,
              high_12min: 0,
              dayLow: 0,
              dayHigh: 0,
              previous: 0,
              change: 0,
              changePercentage: 0,
              volume: 0,
              adjust: 0,
              date: new Date().toISOString(),
              moverGraph: require("../../assets/images/token-placeholder.png"),
              kesBalance: 0,
            } as EnhancedMyTokens);
          }
        });
      }

      return {
        user,
        userStocks,
        userTokens,
      };
    },
    staleTime: 60000, // 1 minute
  });

  // Function to get stock details (for individual stock pages)
  const getStockDetails = (stockCode: string) => {
    const stock = data?.userStocks.find((s) => s.code === stockCode);
    const stats = stockStats[stockCode] || null;

    return {
      stock,
      stats,
    };
  };

  // Function to get token details
  const getTokenDetails = (tokenCode: string) => {
    const token = data?.userTokens.find((t) => t.code === tokenCode);
    const stats = stockStats[tokenCode] || null;

    return {
      token,
      stats,
    };
  };

  return {
    user: data?.user,
    stocks: data?.userStocks ?? [],
    tokens: data?.userTokens ?? [],
    isLoading,
    error,
    refetch,
    getStockDetails,
    getTokenDetails,
  };
}

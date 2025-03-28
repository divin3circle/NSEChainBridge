import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, MyTokens } from "../../constants/Data";
import { adaptTokensToFrontendFormat } from "../utils/apiAdapters";

interface TokenResponse {
  tokens: {
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
  }[];
}

export function useTokens() {
  const queryClient = useQueryClient();

  const {
    data: tokens,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tokens"],
    queryFn: async (): Promise<MyTokens[]> => {
      const response = await fetch(`${API_BASE_URL}/tokens`);

      if (!response.ok) {
        throw new Error(`Error fetching tokens: ${response.status}`);
      }

      const tokensData: TokenResponse = await response.json();

      return adaptTokensToFrontendFormat(tokensData.tokens);
    },
    staleTime: 60000,
  });

  const mintMutation = useMutation({
    mutationFn: async ({
      stockCode,
      amount,
    }: {
      stockCode: string;
      amount: number;
    }) => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/tokens/${stockCode}/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mint tokens");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  const burnMutation = useMutation({
    mutationFn: async ({
      stockCode,
      amount,
    }: {
      stockCode: string;
      amount: number;
    }) => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/tokens/${stockCode}/burn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to burn tokens");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  return {
    tokens: tokens ?? [],
    isLoading,
    error,
    mintTokens: mintMutation.mutate,
    isMinting: mintMutation.isPending,
    mintError: mintMutation.error,
    burnTokens: burnMutation.mutate,
    isBurning: burnMutation.isPending,
    burnError: burnMutation.error,
  };
}

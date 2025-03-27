import { useState, useEffect } from "react";
import { adaptTokensToFrontendFormat } from "../utils/apiAdapters";
import { MyTokens } from "../../constants/Data";

// Define your API base URL
const API_BASE_URL = "http://localhost:5001/api";

export function useTokens() {
  const [tokens, setTokens] = useState<MyTokens[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      try {
        setLoading(true);

        // Get token list and user balances
        const [tokensResponse, balancesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/tokens`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${API_BASE_URL}/tokens/balances`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        if (!tokensResponse.ok) {
          throw new Error(`Error fetching tokens: ${tokensResponse.status}`);
        }

        if (!balancesResponse.ok) {
          throw new Error(
            `Error fetching balances: ${balancesResponse.status}`
          );
        }

        const tokensData = await tokensResponse.json();
        const balancesData = await balancesResponse.json();

        // Transform the data to match the frontend structure
        const transformedTokens = adaptTokensToFrontendFormat(
          tokensData.tokens,
          balancesData.balances
        );

        setTokens(transformedTokens);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, []);

  // Handler for minting tokens
  const mintTokens = async (stockCode: string, amount: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/${stockCode}/mint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mint tokens");
      }

      // Refresh token data after minting
      const [tokensResponse, balancesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tokens`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`${API_BASE_URL}/tokens/balances`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      const tokensData = await tokensResponse.json();
      const balancesData = await balancesResponse.json();

      const transformedTokens = adaptTokensToFrontendFormat(
        tokensData.tokens,
        balancesData.balances
      );

      setTokens(transformedTokens);
      return true;
    } catch (err) {
      console.error("Failed to mint tokens:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return false;
    }
  };

  // Handler for burning tokens
  const burnTokens = async (stockCode: string, amount: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/${stockCode}/burn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to burn tokens");
      }

      // Refresh token data after burning
      const [tokensResponse, balancesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tokens`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch(`${API_BASE_URL}/tokens/balances`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      const tokensData = await tokensResponse.json();
      const balancesData = await balancesResponse.json();

      const transformedTokens = adaptTokensToFrontendFormat(
        tokensData.tokens,
        balancesData.balances
      );

      setTokens(transformedTokens);
      return true;
    } catch (err) {
      console.error("Failed to burn tokens:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return false;
    }
  };

  return { tokens, loading, error, mintTokens, burnTokens };
}

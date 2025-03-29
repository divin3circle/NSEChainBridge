import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, MyTokens } from "../../constants/Data";
import { adaptTokensToFrontendFormat } from "../utils/apiAdapters";
import {
  Client,
  PrivateKey,
  TokenId,
  AccountId,
  TransferTransaction,
  Hbar,
} from "@hashgraph/sdk";

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

interface BurnResponse {
  message: string;
  transaction: {
    hederaTransactionId: string;
  };
  stockHolding: {
    availableQuantity: number;
  };
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
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  const burnMutation = useMutation<
    BurnResponse,
    Error,
    { stockCode: string; amount: number }
  >({
    mutationFn: async ({ stockCode, amount }): Promise<BurnResponse> => {
      // Get authentication token
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("Authentication token not found in AsyncStorage");
        throw new Error("Authentication token not found");
      }

      // Get user data and private key separately
      console.log("Getting user data and private key...");
      const [userStr, privateKey] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("hederaPrivateKey"),
      ]);

      if (!userStr) {
        console.error("User data not found in AsyncStorage");
        throw new Error("User data not found");
      }
      if (!privateKey) {
        console.error("Hedera private key not found in AsyncStorage");
        throw new Error("Hedera private key not found");
      }

      const user = JSON.parse(userStr);
      console.log("User data available fields:", Object.keys(user));

      if (!user.hederaAccountId) {
        console.error("Hedera account ID not found in user data");
        throw new Error("Hedera account ID not found in user data");
      }

      console.log("Getting token details...");
      // Get token details to get treasury account
      const tokenResponse = await fetch(
        `${API_BASE_URL}/tokens/by-stock/${stockCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Failed to get token details:", errorData);
        throw new Error(errorData.message || "Failed to get token details");
      }

      const tokenData = await tokenResponse.json();
      const treasuryAccountId = tokenData.token.treasuryAccountId;

      console.log("Creating transfer transaction...");
      console.log(`From: ${user.hederaAccountId}`);
      console.log(`To: ${treasuryAccountId}`);
      console.log(`Amount: ${amount}`);
      console.log(`Token ID: ${tokenData.token.tokenId}`);
      let client;

      // Your account ID and private key from string value
      const MY_ACCOUNT_ID = AccountId.fromString("0.0.5171455");
      const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(
        "4666f5b5e528d5c549ea78d540b31ee18802145e242f31e3af079e0975da2294"
      );

      // Pre-configured client for test network (testnet)
      client = Client.forTestnet();

      //Set the operator with the account ID and private key
      client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
      const hederaPrivateKey = PrivateKey.fromString(privateKey);
      const tokenId = TokenId.fromString(tokenData.token.tokenId);

      // Create the transaction
      const transaction = new TransferTransaction()
        .addTokenTransfer(
          tokenId,
          AccountId.fromString(user.hederaAccountId),
          -amount
        )
        .addTokenTransfer(
          tokenId,
          AccountId.fromString(treasuryAccountId),
          amount
        );

      // Set max transaction fee
      transaction.setMaxTransactionFee(new Hbar(10));

      // Freeze with client
      console.log("Freezing transaction with client...");
      const frozenTx = await transaction.freezeWith(client);
      console.log("Transaction frozen successfully");

      console.log("Transaction created, signing...");
      const signedTx = await frozenTx.sign(hederaPrivateKey);
      console.log("Transaction signed, executing...");
      const txResponse = await signedTx.execute(client);
      console.log("Transaction executed, getting receipt...");
      const receipt = await txResponse.getReceipt(client);

      if (receipt.status.toString() !== "SUCCESS") {
        console.error(
          "Transaction failed with status:",
          receipt.status.toString()
        );
        throw new Error(`Token transfer failed: ${receipt.status.toString()}`);
      }

      console.log("Transaction successful, sending to backend...");
      console.log("Transaction ID:", txResponse.transactionId.toString());

      // Send the burn request with transaction ID to the backend
      const burnResponse = await fetch(
        `${API_BASE_URL}/tokens/${stockCode}/burn`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            transactionId: txResponse.transactionId.toString(),
          }),
        }
      );

      if (!burnResponse.ok) {
        const errorData = await burnResponse.json();
        console.error("Backend burn request failed:", errorData);
        throw new Error(errorData.message || "Failed to burn tokens");
      }

      const result = await burnResponse.json();
      console.log("Backend response:", result);
      if (!result) {
        throw new Error("No response from backend");
      }
      return result;
    },
    onError: (error: Error) => {
      console.error("Burn mutation error:", error);
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onSuccess: (data: BurnResponse) => {
      console.log("Burn mutation success:", data);
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
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

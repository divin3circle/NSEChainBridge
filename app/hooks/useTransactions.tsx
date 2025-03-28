import { API_BASE_URL } from "@/constants/Data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// {
//     "_id": "67e6a30a81a821e564e892d1",
//     "userId": "67e644e210b10d162b50dd11",
//     "tokenId": "0.0.5784604",
//     "stockCode": "KCB",
//     "amount": 1,
//     "type": "MINT",
//     "status": "COMPLETED",
//     "fee": 0,
//     "paymentTokenId": "HBAR",
//     "paymentAmount": 0,
//     "createdAt": "2025-03-28T13:24:26.741Z",
//     "updatedAt": "2025-03-28T13:24:26.741Z",
//     "__v": 0
// },

interface Transaction {
  _id: string;
  userId: string;
  tokenId: string;
  stockCode: string;
  amount: number;
  type: string;
  status: string;
  fee: number;
  paymentTokenId: string;
  paymentAmount: number;
  createdAt: string;
  updatedAt: string;
}

export function useTransactions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: async (): Promise<Transaction[]> => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/transactions/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      return data.transactions;
    },
  });

  return {
    transactions: data || [],
    isLoading,
    error,
  };
}

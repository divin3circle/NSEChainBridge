import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { API_BASE_URL, MyTokens } from "../../constants/Data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    hederaAccountId?: string;
    privateKey?: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials extends LoginCredentials {
  name: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const saveAuthData = async (data: AuthResponse) => {
    try {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const saveHederaData = async (accountId: string, privateKey: string) => {
    try {
      await AsyncStorage.setItem("hederaAccountId", accountId);
      await AsyncStorage.setItem("hederaPrivateKey", privateKey);

      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.hederaAccountId = accountId;
        user.privateKey = privateKey;
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error) {
      console.error("Error saving Hedera data:", error);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      return response.json();
    },
    onSuccess: async (data: AuthResponse) => {
      await saveAuthData(data);
      if (data.user.hederaAccountId) {
        router.replace("/(tabs)");
      } else {
        router.replace("/create");
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      return response.json();
    },
    onSuccess: async (data: AuthResponse) => {
      await saveAuthData(data);
      router.replace("/create");
    },
  });

  const createHederaAccountMutation = useMutation({
    mutationFn: async () => {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/auth/create-hedera-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create Hedera account");
      }

      return response.json();
    },
    onSuccess: async (data: { accountId: string; privateKey: string }) => {
      await saveHederaData(data.accountId, data.privateKey);
      router.replace("/(tabs)");
    },
  });

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "token",
        "user",
        "hederaAccountId",
        "hederaPrivateKey",
      ]);
      queryClient.clear();
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return {
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    createHederaAccount: createHederaAccountMutation.mutate,
    logout,
    isLoading:
      loginMutation.isPending ||
      signupMutation.isPending ||
      createHederaAccountMutation.isPending,
    error:
      loginMutation.error ||
      signupMutation.error ||
      createHederaAccountMutation.error,
  };
}

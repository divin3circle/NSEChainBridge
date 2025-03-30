import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { Colors, fonts } from "@/constants/Colors";
import { useAuth } from "./hooks/useAuth";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useWalletService } from "../app/hooks/useWalletService";

const { width } = Dimensions.get("window");

type AccountStatus =
  | "initial"
  | "creating"
  | "created"
  | "creating_wallet"
  | "wallet_created"
  | "error";

interface AccountDetails {
  accountId: string;
  publicKey: string;
  balance: string;
}

interface WalletDetails {
  address: string;
  connected: boolean;
  network: string;
  createdAt: string;
}

const Create = () => {
  const { createHederaAccount, isLoading, error } = useAuth();
  const { open } = useWalletService();
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("initial");
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null
  );
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletCreated, setWalletCreated] = useState(false);

  const handleCreateAccount = async () => {
    try {
      setAccountStatus("creating");
      await createHederaAccount();
      // Get the account details from AsyncStorage
      const [accountId, publicKey] = await Promise.all([
        AsyncStorage.getItem("hederaAccountId"),
        AsyncStorage.getItem("hederaPublicKey"),
      ]);

      if (accountId && publicKey) {
        setAccountDetails({
          accountId,
          publicKey,
          balance: "0.0", // Initial balance will be updated
        });
        setAccountStatus("created");
      } else {
        throw new Error("Failed to get account details");
      }
    } catch (err) {
      setAccountStatus("error");
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setWalletError(null);

      // Get the existing user data
      const userData = await AsyncStorage.getItem("user");
      console.log("User data from storage:", userData);

      if (!userData) {
        throw new Error("User data not found");
      }
      const user = JSON.parse(userData);
      console.log("Parsed user data:", user);

      // Get Hedera account ID directly from storage as backup
      const hederaAccountId = await AsyncStorage.getItem("hederaAccountId");
      console.log("Hedera account ID from storage:", hederaAccountId);

      // Use either the user's Hedera account ID or the one from storage
      const accountId = user.hederaAccountId || hederaAccountId;
      if (!accountId) {
        throw new Error("Hedera account ID not found");
      }

      // Connect to the wallet using the existing account
      const result = await open();
      console.log("Wallet connection result:", result);

      // Store wallet connection details
      await AsyncStorage.setItem("walletConnected", "true");
      await AsyncStorage.setItem("walletAddress", accountId);
      await AsyncStorage.setItem("walletNetwork", "hedera-testnet");
      await AsyncStorage.setItem("walletCreatedAt", new Date().toISOString());

      // Store complete wallet details
      const walletDetails = {
        accountId,
        network: "hedera-testnet",
        createdAt: new Date().toISOString(),
        userId: user._id,
        email: user.email,
      };
      await AsyncStorage.setItem(
        "walletDetails",
        JSON.stringify(walletDetails)
      );

      setWalletCreated(true);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error creating wallet:", error);
      setWalletError(
        error instanceof Error ? error.message : "Failed to create wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToApp = () => {
    router.replace("/(tabs)");
  };

  const renderContent = () => {
    switch (accountStatus) {
      case "initial":
        return (
          <>
            <Text style={styles.title}>Create Hedera Account</Text>
            <LottieView
              source={require("../assets/lottie/welcome.json")}
              style={{
                width: width * 0.9,
                height: width * 0.9,
              }}
              autoPlay
              loop
            />
            <Text style={styles.description}>
              To start, you need a Hedera account. This account will be used to
              hold your tokenized stocks and process transactions.
            </Text>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.light.tint} />
              ) : (
                <Text style={styles.buttonText}>Create Hedera Account</Text>
              )}
            </TouchableOpacity>
          </>
        );

      case "creating":
        return (
          <>
            <Text style={styles.title}>Creating Your Account</Text>
            <LottieView
              source={require("../assets/lottie/loading.json")}
              style={{
                width: width * 0.7,
                height: width * 0.7,
              }}
              autoPlay
              loop
            />
            <Text style={styles.description}>
              Please wait while we create your Hedera account. This may take a
              few moments.
            </Text>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </>
        );

      case "created":
        return (
          <>
            <Text style={styles.title}>Account Created Successfully!</Text>
            <LottieView
              source={require("../assets/lottie/success.json")}
              style={{
                width: width * 0.7,
                height: width * 0.7,
              }}
              autoPlay
              loop={false}
            />
            <ScrollView style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Account Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account ID:</Text>
                <Text style={styles.detailValue}>
                  {accountDetails?.accountId}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Public Key:</Text>
                <Text style={styles.detailValue}>
                  {accountDetails?.publicKey}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Initial Balance:</Text>
                <Text style={styles.detailValue}>
                  {accountDetails?.balance} HBAR
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateWallet}
            >
              <Text style={styles.buttonText}>Create Wallet</Text>
            </TouchableOpacity>
            <Text style={styles.note}>
              Please save your account details securely. You'll need them to
              access your account later.
            </Text>
          </>
        );

      case "creating_wallet":
        return (
          <>
            <Text style={styles.title}>Creating Your Wallet</Text>
            <LottieView
              source={require("../assets/lottie/loading.json")}
              style={{
                width: width * 0.7,
                height: width * 0.7,
              }}
              autoPlay
              loop
            />
            <Text style={styles.description}>
              Please wait while we set up your wallet. This will only take a
              moment.
            </Text>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </>
        );

      case "wallet_created":
        return (
          <>
            <Text style={styles.title}>Wallet Created Successfully!</Text>
            <LottieView
              source={require("../assets/lottie/success.json")}
              style={{
                width: width * 0.7,
                height: width * 0.7,
              }}
              autoPlay
              loop={false}
            />
            <ScrollView style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Wallet Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{walletDetails?.address}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network:</Text>
                <Text style={styles.detailValue}>{walletDetails?.network}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {walletDetails?.connected ? "Connected" : "Disconnected"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {new Date(walletDetails?.createdAt || "").toLocaleString()}
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.button}
              onPress={handleProceedToApp}
            >
              <Text style={styles.buttonText}>Proceed to App</Text>
            </TouchableOpacity>
            <Text style={styles.note}>
              Your wallet is ready to use. You can now start managing your
              tokenized stocks.
            </Text>
          </>
        );

      case "error":
        return (
          <>
            <Text style={styles.title}>Error Creating Account</Text>
            <LottieView
              source={require("../assets/lottie/error.json")}
              style={{
                width: width * 0.7,
                height: width * 0.7,
              }}
              autoPlay
              loop={false}
            />
            <Text style={styles.error}>
              {error instanceof Error
                ? error.message
                : error || "An error occurred"}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setAccountStatus("initial")}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginBottom: 30,
    color: Colors.light.subtitles,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.light.tint,
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  error: {
    color: "red",
    fontFamily: fonts.regular,
    marginBottom: 20,
    textAlign: "center",
  },
  note: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: "center",
    color: Colors.light.subtitles,
    paddingHorizontal: 30,
  },
  detailsContainer: {
    width: "100%",
    maxHeight: 200,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    marginBottom: 15,
    color: Colors.light.titles,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: Colors.light.subtitles,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: Colors.light.titles,
  },
});

export default Create;

import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import React, { useState, useCallback } from "react";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { blurhash, fonts, Colors } from "../../constants/colors";
import { useStocks } from "../hooks/useStocks";
import { Image } from "expo-image";
import { myTokens, myStocks } from "@/constants/Data";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/Data";

const { width } = Dimensions.get("window");

const CONVERSION_RATE = 0.3; // 1 token = 0.3 USDC

// {"message": "Successfully swapped 10 KCB tokens for 3 USDC", "stockCode": "KCB", "tokensSold": 10, "transactionId": "67e992903425a1ad3a586ce7", "usdcReceived": 3}

interface SwapResponse {
  message: string;
  stockCode: string;
  tokensSold: number;
  transactionId: string;
  usdcReceived: number;
  hederaTransactionId: string;
}

const Token = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tokens, refetch } = useStocks();
  const token = tokens.find((token) => token.code === id);
  let tokenImage =
    myStocks.find((stock) => stock.code === id)?.image ||
    require("../../assets/images/token-placeholder.png");

  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SwapResponse | null>(null);

  console.log(data);

  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
    // Convert to USDC
    if (value === "") {
      setToAmount("");
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const usdcAmount = (numValue * CONVERSION_RATE).toFixed(2);
        setToAmount(usdcAmount);
      }
    }
  }, []);

  const handleSwap = async () => {
    try {
      setError("");
      setData(null);
      setIsLoading(true);

      const accountId = await AsyncStorage.getItem("hederaAccountId");
      const privateKey = await AsyncStorage.getItem("hederaPrivateKey");
      const token = await AsyncStorage.getItem("token");

      console.log(accountId, privateKey, token);

      if (!accountId || !privateKey || !token) {
        throw new Error("Please login first");
      }

      const response = await fetch(`${API_BASE_URL}/tokens/${id}/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(fromAmount),
          accountId,
          privateKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to swap tokens");
      }

      const responseData = await response.json();
      setData(responseData);

      // Show success modal
      setShowSuccessModal(true);

      // Refetch user's token balances
      await refetch();
    } catch (err: any) {
      setError(err.message);
      setShowSuccessModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <TouchableOpacity onPress={() => router.navigate("/(tabs)/wallet")}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.titles} />
          </TouchableOpacity>
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Swap Tokens</Text>
        </View>
      </View>

      <View style={styles.swapContainer}>
        {/* From Section */}
        <View style={styles.swapSection}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputContainer}>
            <View style={styles.tokenInfo}>
              <Image
                source={tokenImage}
                style={styles.tokenIcon}
                contentFit="contain"
              />
              <Text style={styles.tokenSymbol}>{token?.code}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={fromAmount}
              onChangeText={handleFromAmountChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Swap Icon */}
        <View style={styles.swapIconContainer}>
          <Ionicons
            name="swap-vertical"
            size={24}
            color={Colors.light.titles}
          />
        </View>

        {/* To Section */}
        <View style={styles.swapSection}>
          <Text style={styles.label}>To</Text>
          <View style={styles.inputContainer}>
            <View style={styles.tokenInfo}>
              <Image
                source={require("../../assets/images/usdc.png")}
                style={styles.tokenIcon}
                contentFit="contain"
              />
              <Text style={styles.tokenSymbol}>USDC</Text>
            </View>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={toAmount}
              editable={false}
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Rate Display */}
        <View style={styles.rateContainer}>
          <Text style={styles.rateText}>
            1 {token?.code} ≈ {CONVERSION_RATE} USDC
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapButton,
            (!fromAmount || isLoading) && styles.disabledButton,
          ]}
          onPress={handleSwap}
          disabled={!fromAmount || isLoading}
        >
          <Text style={styles.swapButtonText}>
            {isLoading ? "Swapping..." : "Swap"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isLoading) {
            setShowSuccessModal(false);
            setError("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {error ? (
              // Error State
              <View style={styles.modalHeader}>
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle" size={48} color={"#ff4444"} />
                </View>
                <Text style={[styles.modalTitle, { color: "#ff4444" }]}>
                  Error
                </Text>
                <Text style={[styles.modalSubtitle, { color: "#ff4444" }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={styles.tryAgainButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setError("");
                  }}
                >
                  <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : isLoading ? (
              // Loading State
              <View style={styles.modalHeader}>
                <View style={styles.loadingIcon}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.light.primary}
                  />
                </View>
                <Text style={styles.modalTitle}>Swapping Tokens...</Text>
                <Text style={styles.modalSubtitle}>
                  Please wait while we process your transaction
                </Text>
              </View>
            ) : (
              // Success State
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={Colors.light.primary}
                    />
                  </View>
                  <Text style={styles.modalTitle}>
                    Tokens Swapped Successfully!
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Your transaction has been confirmed on the network
                  </Text>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sold Amount</Text>
                    <Text style={styles.detailValue}>
                      {fromAmount} {token?.code} Tokens
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Received</Text>
                    <Text style={styles.detailValue}>{toAmount} USDC</Text>
                  </View>
                  {data?.hederaTransactionId && (
                    <>
                      <View style={[styles.detailRow, styles.transactionIdRow]}>
                        <Text style={styles.detailLabel}>Transaction ID</Text>
                        <Text
                          style={[styles.detailValue, styles.transactionId]}
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {data.hederaTransactionId}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.viewOnHashscanButton}
                        onPress={() => {
                          Linking.openURL(
                            `https://hashscan.io/testnet/transaction/${data?.hederaTransactionId}`
                          );
                        }}
                      >
                        <Text style={styles.viewOnHashscanText}>
                          View on HashScan
                        </Text>
                        <Ionicons
                          name="open-outline"
                          size={16}
                          color={Colors.light.primary}
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.viewWalletButton]}
                    onPress={() => {
                      setShowSuccessModal(false);
                      router.push("/(tabs)/wallet");
                    }}
                  >
                    <Text style={styles.viewWalletButtonText}>
                      View in Wallet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => {
                      setShowSuccessModal(false);
                      router.back();
                    }}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Token;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    color: "#666",
    fontSize: 12,
  },
  swapContainer: {
    padding: 16,
    position: "relative",
  },
  swapSection: {
    backgroundColor: "#E5E3E3FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    height: width * 0.3,
  },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    fontFamily: fonts.semiBold,
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  input: {
    fontSize: 24,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.semiBold,
  },
  disabledInput: {
    color: "#666",
  },
  swapIconContainer: {
    alignItems: "center",
    padding: 4,
  },
  rateContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  rateText: {
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 8,
  },
  swapButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  swapButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: Colors.light.titles,
    marginTop: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 8,
    textAlign: "center",
  },
  transactionDetails: {
    backgroundColor: `${Colors.light.primary}10`,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  detailValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: Colors.light.titles,
  },
  transactionIdRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tint,
  },
  transactionId: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.titles,
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  viewOnHashscanButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewOnHashscanText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: Colors.light.primary,
  },
  modalButtons: {
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  viewWalletButton: {
    backgroundColor: Colors.light.primary,
  },
  viewWalletButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#fff",
  },
  closeButton: {
    backgroundColor: Colors.light.tint,
  },
  closeButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.primary,
  },
  loadingIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  errorIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  successIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  tryAgainButton: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: 200,
    alignSelf: "center",
  },
  tryAgainButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    textAlign: "center",
    color: Colors.light.primary,
  },
});

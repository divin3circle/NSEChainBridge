import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from "react-native";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { myStocks, myTokens, stockStats } from "@/constants/Data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, fonts } from "../../constants/colors";
import { Image } from "expo-image";
import { blurhash } from "../../constants/colors";
import { useTokens } from "../hooks/useTokens";
import { useStocks } from "../hooks/useStocks";
import { Linking } from "react-native";

interface BurnResponse {
  message: string;
  transaction: {
    hederaTransactionId: string;
  };
  stockHolding: {
    availableQuantity: number;
  };
}

const BurnToken = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<BurnResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const { burnTokens, isBurning, burnError } = useTokens();
  const { stocks } = useStocks();

  const stock = stocks.find((s) => s.code === id);
  const userToken = myTokens.find((t) => t.code === id);

  const maxBurnableAmount = userToken ? userToken.stockBlanace : 0;
  const stockValue = stock ? Number(amount || 0) * stock.dayPrice : 0;

  const estimatedFee = stockValue * 0.001;
  const totalCost = stockValue + estimatedFee;

  const canBurn = useMemo(() => {
    if (!amount || !stock || !userToken) return false;
    const burnAmount = Number(amount);
    return burnAmount > 0 && burnAmount <= maxBurnableAmount;
  }, [amount, maxBurnableAmount, userToken]);

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.floor((maxBurnableAmount * percentage) / 100);
    setAmount(amount.toString());
  };

  const handleBurn = async () => {
    try {
      setError(null);
      setTransactionData(null);
      setShowSuccessModal(true);

      console.log("Starting burn process...");
      burnTokens(
        {
          stockCode: id as string,
          amount: Number(amount),
        },
        {
          onSuccess: (result) => {
            console.log("Burn result:", result);
            console.log("Transaction data:", {
              stockHolding: result.stockHolding,
              transaction: result.transaction,
            });
            setTransactionData(result);
          },
          onError: (error: any) => {
            console.error("Burn error:", error);
            setError(error.message || "Failed to burn tokens");
          },
        }
      );
    } catch (error: any) {
      console.error("Burn error:", error);
      setError(error.message || "Failed to burn tokens");
    }
  };

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isBurning) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isBurning]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!stock) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Stock not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={Colors.light.titles} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Burn {stock.code} Tokens</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount to Burn</Text>
            <View style={styles.tokenPreview}>
              <Image
                source={stock.image}
                style={styles.tokenPreviewImage}
                placeholder={{ blurhash }}
                contentFit="contain"
                transition={1000}
              />
              <View>
                <Text style={styles.tokenPreviewCode}>{stock.code}</Text>
                <Text style={styles.tokenPreviewName}>{stock.name}</Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.light.muted}
              />
              <View style={styles.maxContainer}>
                <Text style={styles.maxLabel}>Max: {maxBurnableAmount}</Text>
              </View>
            </View>
            <View style={styles.quickAmounts}>
              {[25, 50, 75, 100].map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  style={styles.quickAmount}
                  onPress={() => handleQuickAmount(percentage)}
                >
                  <Text style={styles.quickAmountText}>{percentage}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You Will Receive</Text>
            <View style={styles.receiveInfo}>
              <View style={styles.tokenAmount}>
                <Text style={styles.tokenAmountValue}>
                  {Number(amount || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.tokenRatio}>
                <Text style={styles.tokenAmountLabel}>{stock.code} Shares</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock Price</Text>
              <Text style={styles.detailValue}>
                KES {stock.dayPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Value</Text>
              <Text style={styles.detailValue}>
                KES {stockValue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network Fee</Text>
              <Text style={styles.detailValue}>
                KES {estimatedFee.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>
                KES {totalCost.toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.burnButton, !canBurn && styles.burnButtonDisabled]}
            disabled={!canBurn || isBurning}
            onPress={handleBurn}
          >
            <Text style={styles.burnButtonText}>
              {isBurning
                ? "Burning..."
                : canBurn
                ? "Burn Tokens"
                : "Insufficient Balance"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isBurning) {
            setShowSuccessModal(false);
            setError(null);
            setTransactionData(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {error ? (
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
                    setError(null);
                  }}
                >
                  <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : isBurning ? (
              <View style={styles.modalHeader}>
                <View style={styles.loadingIcon}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons
                      name="sync"
                      size={48}
                      color={Colors.light.primary}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.modalTitle}>Burning Tokens...</Text>
                <Text style={styles.modalSubtitle}>
                  Please wait while we process your transaction
                </Text>
              </View>
            ) : transactionData ? (
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
                    Tokens Burned Successfully!
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Your transaction has been confirmed on the network
                  </Text>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Burned Amount</Text>
                    <Text style={styles.detailValue}>
                      {amount} {stock.code} Tokens
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mintable Balance</Text>
                    <Text style={styles.detailValue}>
                      {transactionData.stockHolding.availableQuantity / 2}{" "}
                      {stock.code} Tokens
                    </Text>
                  </View>
                  {transactionData.transaction.hederaTransactionId && (
                    <>
                      <View style={[styles.detailRow, styles.transactionIdRow]}>
                        <Text style={styles.detailLabel}>Transaction ID</Text>
                        <Text
                          style={[styles.detailValue, styles.transactionId]}
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {transactionData.transaction.hederaTransactionId}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.viewOnHashscanButton}
                        onPress={() => {
                          Linking.openURL(
                            `https://hashscan.io/testnet/transaction/${transactionData.transaction.hederaTransactionId}`
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
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BurnToken;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 12,
    padding: 16,
  },
  input: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: Colors.light.titles,
  },
  maxContainer: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  maxLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  quickAmount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  quickAmountText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
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
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tint,
  },
  totalLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: Colors.light.titles,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tint,
  },
  burnButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  burnButtonDisabled: {
    backgroundColor: Colors.light.tint,
  },
  burnButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#fff",
  },
  tokenPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 12,
  },
  tokenPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenPreviewCode: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
  },
  tokenPreviewName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  receiveInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: 12,
  },
  tokenAmount: {
    alignItems: "flex-start",
  },
  tokenAmountValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: Colors.light.titles,
  },
  tokenAmountLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 4,
  },
  tokenRatio: {
    alignItems: "flex-end",
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

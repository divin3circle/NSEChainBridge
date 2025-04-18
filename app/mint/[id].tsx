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
import { blurhash, fonts, Colors } from "../../constants/colors";
import { Image } from "expo-image";
import { useTokens } from "../hooks/useTokens";
import { useStocks } from "../hooks/useStocks";

const PAYMENT_TOKENS = ["HBAR", "KSH"];

const MintToken = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selectedPaymentToken, setSelectedPaymentToken] = useState(
    PAYMENT_TOKENS[0]
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  const { mintTokens, isMinting, mintError } = useTokens();
  const { stocks } = useStocks();

  const stock = stocks.find((s) => s.code === id);
  const paymentTokens = myTokens.filter((token) =>
    PAYMENT_TOKENS.includes(token.code)
  );

  const maxMintableAmount = stock ? Math.floor(stock.stockBlanace * 0.5) : 0;
  const stockValue = stock ? Number(amount || 0) * stock.dayPrice : 0;
  const selectedToken = paymentTokens.find(
    (token) => token.code === selectedPaymentToken
  );

  const estimatedFee = stockValue * 0.001; // 0.1% fee
  const totalCost = stockValue + estimatedFee;

  const canMint = useMemo(() => {
    if (!amount || !stock || !selectedToken) return false;
    const mintAmount = Number(amount);
    return (
      mintAmount > 0 &&
      mintAmount <= maxMintableAmount &&
      selectedToken.stockBlanace >= totalCost
    );
  }, [amount, maxMintableAmount, selectedToken, totalCost]);

  const handleQuickAmount = (percentage: number) => {
    const amount = Math.floor((maxMintableAmount * percentage) / 100);
    setAmount(amount.toString());
  };

  const handleMint = async () => {
    try {
      setShowSuccessModal(true); // Show modal immediately with loading state
      const result = await mintTokens({
        stockCode: id as string,
        amount: Number(amount),
      });
      setTransactionData(result);
    } catch (error) {
      console.error("Mint error:", error);
      setShowSuccessModal(false); // Hide modal if there's an error
    }
  };

  const spinValue = useRef(new Animated.Value(0)).current;

  // Set up the spinning animation
  useEffect(() => {
    if (isMinting) {
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
  }, [isMinting]);

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
            <Text style={styles.headerTitle}>Mint {stock.code} Tokens</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount to Mint</Text>
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
                <Text style={styles.maxLabel}>Max: {maxMintableAmount}</Text>
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
                <Text style={styles.tokenAmountLabel}>{stock.code} Tokens</Text>
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
            style={[styles.mintButton, !canMint && styles.mintButtonDisabled]}
            disabled={!canMint || isMinting}
            onPress={handleMint}
          >
            <Text style={styles.mintButtonText}>
              {isMinting
                ? "Minting..."
                : canMint
                ? "Mint Tokens"
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
        onRequestClose={() => !isMinting && setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {isMinting ? (
                <>
                  <View style={styles.loadingIcon}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons
                        name="sync"
                        size={48}
                        color={Colors.light.primary}
                      />
                    </Animated.View>
                  </View>
                  <Text style={styles.modalTitle}>Minting Tokens...</Text>
                </>
              ) : (
                <>
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={Colors.light.primary}
                    />
                    <Text style={styles.modalTitle}>
                      Tokens Minted Successfully!
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: Colors.light.tint,
                        padding: 10,
                        borderRadius: 10,
                        marginTop: 10,
                        width: 200,
                        alignSelf: "center",
                      }}
                      onPress={() => {
                        setShowSuccessModal(false);
                        router.push("/(tabs)/wallet");
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.semiBold,
                          fontSize: 16,
                          textAlign: "center",
                          color: Colors.light.primary,
                        }}
                      >
                        View in Wallet
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {!isMinting && transactionData && (
              <>
                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={styles.detailValue}>
                      {transactionData.tokenHolding.balance} {stock.code} Tokens
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Available Stock</Text>
                    <Text style={styles.detailValue}>
                      {transactionData.stockHolding.availableQuantity} shares
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>
                      {transactionData.transaction.hederaTransactionId}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewWalletButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.push("/(tabs)/wallet");
                  }}
                >
                  <Text style={styles.viewWalletButtonText}>
                    View in Wallet
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MintToken;

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
  paymentTokens: {
    gap: 12,
  },
  paymentToken: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 12,
  },
  selectedPaymentToken: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenCode: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
  },
  tokenBalance: {
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
  mintButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  mintButtonDisabled: {
    backgroundColor: Colors.light.tint,
  },
  mintButtonText: {
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
  tokenRatioLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  tokenRatioValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
    marginTop: 4,
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
  transactionDetails: {
    marginBottom: 24,
  },
  viewWalletButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  viewWalletButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#fff",
  },
  loadingIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
});

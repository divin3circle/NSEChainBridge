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
} from "react-native";
import React, { useState, useMemo } from "react";
import { myStocks, myTokens, stockStats } from "@/constants/Data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, fonts } from "@/constants/Colors";
import { Image } from "expo-image";
import { blurhash } from "@/constants/Colors";

const PAYMENT_TOKENS = ["HBAR", "KSH"];

const MintToken = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [selectedPaymentToken, setSelectedPaymentToken] = useState(
    PAYMENT_TOKENS[0]
  );

  const stock = myStocks.find((s) => s.code === id);
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
                <Text style={styles.tokenAmountLabel}>{stock.code} Tokens</Text>
              </View>
              <View style={styles.tokenRatio}>
                <Text style={styles.tokenRatioLabel}>P/E Ratio</Text>
                <Text style={styles.tokenRatioValue}>
                  {stockStats[stock.code].peRatio}x
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pay with</Text>
            <View style={styles.paymentTokens}>
              {paymentTokens.map((token) => (
                <TouchableOpacity
                  key={token.code}
                  style={[
                    styles.paymentToken,
                    selectedPaymentToken === token.code &&
                      styles.selectedPaymentToken,
                  ]}
                  onPress={() => setSelectedPaymentToken(token.code)}
                >
                  <Image
                    source={token.image}
                    style={styles.tokenImage}
                    placeholder={{ blurhash }}
                    contentFit="contain"
                    transition={1000}
                  />
                  <View>
                    <Text style={styles.tokenCode}>{token.code}</Text>
                    <Text style={styles.tokenBalance}>
                      Balance: KES {token.stockBlanace.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
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
            disabled={!canMint}
            onPress={() => {
              // Handle minting logic here
              router.back();
            }}
          >
            <Text style={styles.mintButtonText}>
              {canMint ? "Mint Tokens" : "Insufficient Balance"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
});

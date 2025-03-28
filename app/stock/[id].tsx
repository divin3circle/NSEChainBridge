import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { blurhash, Colors, fonts } from "@/constants/Colors";
import { stockStats, timeRanges } from "@/constants/Data";
import { useStocks } from "../hooks/useStocks";
import { useTokens } from "../hooks/useTokens";

const { width } = Dimensions.get("window");

const StockScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { stocks, isLoading, error, refetch } = useStocks();
  const {
    tokens,
    isLoading: isTokensLoading,
    error: tokensError,
  } = useTokens();
  const [selectedTimeRange, setSelectedTimeRange] = useState("1w");

  const stock = stocks.find((s) => s.code === id);
  const myStock = stocks.find((s) => s.code === id);
  const myToken = tokens.find((t) => t.code === id);
  const stats = stockStats[id as string];

  if (isLoading || isTokensLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading your holdings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading your holdings</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stock || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Stock not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.titles} />
          </TouchableOpacity>
          <View style={styles.stockInfo}>
            <View style={styles.logoContainer}>
              <Image
                source={stock.image}
                style={styles.logo}
                placeholder={{ blurhash }}
                contentFit="contain"
                transition={1000}
              />
            </View>
            <View>
              <Text style={styles.stockCode}>{stock.code}</Text>
              <Text style={styles.stockName}>{stock.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>
            KES {stock.dayPrice.toLocaleString()}
          </Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={stock.change < 0 ? "caret-down" : "caret-up"}
              size={20}
              color={stock.change < 0 ? "#D92A2A" : "#19AF00"}
            />
            <Text
              style={[
                styles.change,
                { color: stock.change < 0 ? "#D92A2A" : "#19AF00" },
              ]}
            >
              {stock.changePercentage}%
            </Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Image
            source={stock.moverGraph}
            style={styles.chart}
            placeholder={{ blurhash }}
            contentFit="contain"
            transition={1000}
          />
          <View style={styles.timeRanges}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.timeButton,
                  selectedTimeRange === range.value &&
                    styles.selectedTimeButton,
                ]}
                onPress={() => setSelectedTimeRange(range.value)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    selectedTimeRange === range.value &&
                      styles.selectedTimeButtonText,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Market Cap</Text>
              <Text style={styles.statValue}>
                {stats.marketCap.toFixed(1)}B KES
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>P/E Ratio</Text>
              <Text style={styles.statValue}>{stats.peRatio}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>24h Volume</Text>
              <Text style={styles.statValue}>
                {stats.volume24h.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Dividend Yield</Text>
              <Text style={styles.statValue}>{stats.dividend}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Available Balance</Text>
              <Text style={styles.tokenValue}>
                {myStock?.stockBlanace.toLocaleString()}
              </Text>
            </View>
            <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Maximum Mintable Amount</Text>
              <Text style={styles.tokenValue}>
                {Number(0.5 * (myStock?.stockBlanace || 0)).toLocaleString()}
              </Text>
            </View>
            <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Price</Text>
              <Text style={styles.tokenValue}>KES {stock.dayPrice}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Details</Text>
          <View style={styles.tokenInfo}>
            <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Token ID</Text>
              <Text style={styles.tokenValue}>{myToken?.tokenId}</Text>
            </View>
            <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Total / Stock Ratio</Text>
              <Text style={styles.tokenValue}>1 : 1</Text>
            </View>
            {/* <View style={styles.tokenDetail}>
              <Text style={styles.tokenLabel}>Circulating Supply</Text>
              <Text style={styles.tokenValue}>
                {myToken?.circulatingSupply}
              </Text>
            </View> */}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#19AF00" }]}
            onPress={() => router.navigate(`/mint/${id}`)}
          >
            <Text style={styles.actionButtonText}>Mint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#D92A2A" }]}
            onPress={() => router.navigate(`/mint/${id}`)}
          >
            <Text style={styles.actionButtonText}>Burn</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StockScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tint,
  },
  backButton: {
    marginRight: 16,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  stockCode: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: Colors.light.titles,
  },
  stockName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  priceSection: {
    padding: 16,
    alignItems: "center",
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: Colors.light.titles,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  change: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  chartSection: {
    padding: 16,
    alignItems: "center",
  },
  chart: {
    width: width - 32,
    height: 200,
    marginBottom: 16,
  },
  timeRanges: {
    flexDirection: "row",
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
  },
  selectedTimeButton: {
    backgroundColor: Colors.light.primary,
  },
  timeButtonText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  selectedTimeButtonText: {
    color: "#fff",
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tint,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginBottom: 16,
    color: Colors.light.titles,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    width: (width - 48) / 2 - 8,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  statValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.light.titles,
    marginTop: 4,
  },
  tokenInfo: {
    gap: 12,
  },
  tokenDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  tokenValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: Colors.light.titles,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#fff",
  },
  errorText: {
    fontFamily: fonts.regular,
    color: "#F44336",
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.regular,
    color: Colors.light.subtitles,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: fonts.semiBold,
    color: Colors.light.tint,
  },
});

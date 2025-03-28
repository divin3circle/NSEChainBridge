import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useStocks } from "../hooks/useStocks";
import { Colors, fonts } from "@/constants/Colors";
import { useRouter } from "expo-router";

type HoldingsTab = "stocks" | "tokens";

export default function MyHoldings() {
  const router = useRouter();
  const { stocks, tokens, isLoading, error, refetch } = useStocks();

  const [activeTab, setActiveTab] = useState<HoldingsTab>("stocks");

  const currentData = activeTab === "stocks" ? stocks : tokens;
  const noHoldings = !currentData || currentData.length === 0;

  const handleItemPress = (code: string) => {
    if (activeTab === "stocks") {
      router.push(`/stock/${code}`);
    } else {
      router.push(`/stock/${code}?type=token`);
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "stocks" && styles.activeTab]}
        onPress={() => setActiveTab("stocks")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "stocks" && styles.activeTabText,
          ]}
        >
          Stocks
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "tokens" && styles.activeTab]}
        onPress={() => setActiveTab("tokens")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "tokens" && styles.activeTabText,
          ]}
        >
          Tokens
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
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

  if (noHoldings) {
    return (
      <View style={styles.container}>
        {renderTabs()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === "stocks"
              ? "You do not have any stocks yet"
              : "You do not have any tokens yet"}
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              router.push("/(tabs)");
            }}
          >
            <Text style={styles.actionButtonText}>
              {activeTab === "stocks" ? "Browse Stocks" : "Get Tokens"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabs()}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.holdingItem}
            onPress={() => handleItemPress(item.code)}
          >
            <View style={styles.leftContent}>
              <Image
                source={item.image}
                style={styles.stockImage}
                contentFit="cover"
              />
              <View>
                <Text style={styles.stockCode}>{item.code}</Text>
                <Text style={styles.stockName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.rightContent}>
              <Text style={styles.stockBalance}>
                {(item.stockBlanace || 0).toLocaleString()}{" "}
                {activeTab === "tokens" ? item.code : "shares"}
              </Text>
              <Text
                style={[
                  styles.stockPrice,
                  item.change > 0
                    ? styles.positive
                    : item.change < 0
                    ? styles.negative
                    : null,
                ]}
              >
                KES {Number(item.dayPrice * item.stockBlanace).toLocaleString()}{" "}
                <Text style={styles.changePercent}>
                  {item.change > 0 ? "+" : item.change < 0 ? "-" : ""}
                  {(item.changePercentage || 0).toFixed(2)}%
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontFamily: fonts.regular,
    color: Colors.light.subtitles,
  },
  activeTabText: {
    color: Colors.light.tint,
  },
  holdingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  stockCode: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  stockName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.light.subtitles,
  },
  rightContent: {
    alignItems: "flex-end",
  },
  stockBalance: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  stockPrice: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  positive: {
    color: "#4CAF50",
  },
  negative: {
    color: "#F44336",
  },
  changePercent: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 20,
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
  errorText: {
    fontFamily: fonts.regular,
    color: "#F44336",
    marginBottom: 10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.light.subtitles,
    marginBottom: 20,
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    fontFamily: fonts.semiBold,
    color: Colors.light.tint,
    fontSize: 16,
  },
});

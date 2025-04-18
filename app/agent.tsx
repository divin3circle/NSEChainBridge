import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, fonts } from "../constants/colors";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/Data";
import { useRouter } from "expo-router";
interface PortfolioInsights {
  portfolioValue: number;
  recommendations: Array<{
    stockCode: string;
    type: string;
    reason: string;
    confidence: string;
  }>;
  hbarBalance: number;
}

interface StockSentiment {
  stockName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  sentiment: {
    bullishPercentage: number;
    bearishPercentage: number;
    neutralPercentage: number;
  };
  recentInsights: Array<{
    content: string;
    timestamp: string;
  }>;
}

const Agent = () => {
  const router = useRouter();
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioInsights, setPortfolioInsights] =
    useState<PortfolioInsights | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockSentiment, setStockSentiment] = useState<StockSentiment | null>(
    null
  );
  const [userStocks, setUserStocks] = useState<string[]>([]);
  const [insightInput, setInsightInput] = useState("");
  const [submittingInsight, setSubmittingInsight] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in first");
        setLoading(false);
        return;
      }

      // Get user's stocks
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const stockCodes =
          userData.user.stockHoldings?.map(
            (s: { stockCode: string }) => s.stockCode
          ) || [];
        setUserStocks(stockCodes);

        // If we have stocks, select the first one and get its sentiment
        if (stockCodes.length > 0) {
          setSelectedStock(stockCodes[0]);
          await fetchStockSentiment(stockCodes[0], token);
        }
      }

      // Get portfolio insights using Hedera Agent Kit
      await fetchPortfolioInsights(token);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch market data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch portfolio insights using Hedera Agent Kit
  const fetchPortfolioInsights = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioInsights(data);
      } else {
        console.error(
          "Failed to fetch portfolio insights:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching portfolio insights:", error);
    }
  };

  // Fetch sentiment analysis for a specific stock
  const fetchStockSentiment = async (stockCode: string, token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/market-insights/stocks/${stockCode}/sentiment`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStockSentiment(data);
      } else {
        console.error(
          "Failed to fetch stock sentiment:",
          await response.text()
        );
        setStockSentiment(null);
      }
    } catch (error) {
      console.error("Error fetching stock sentiment:", error);
      setStockSentiment(null);
    }
  };

  // Handle stock selection
  const handleSelectStock = async (stockCode: string) => {
    setSelectedStock(stockCode);
    const token = await AsyncStorage.getItem("token");
    if (token) {
      await fetchStockSentiment(stockCode, token);
    }
  };

  // Submit a new market insight
  const submitInsight = async () => {
    if (!insightInput.trim() || !selectedStock) return;

    setSubmittingInsight(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const accountId = await AsyncStorage.getItem("hederaAccountId");
      const privateKey = await AsyncStorage.getItem("hederaPrivateKey");

      if (!token || !accountId || !privateKey) {
        Alert.alert("Error", "Please log in with a Hedera account");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/market-insights/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stockCode: selectedStock,
          insightType: "general",
          content: insightInput,
          accountId,
          privateKey,
        }),
      });

      if (response.ok) {
        setInsightInput("");
        Alert.alert(
          "Success",
          "Your market insight was published to the Hedera network"
        );
        // Refresh sentiment data
        await fetchStockSentiment(selectedStock, token);
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.message || "Failed to submit insight");
      }
    } catch (error) {
      console.error("Error submitting insight:", error);
      Alert.alert("Error", "Failed to submit insight");
    } finally {
      setSubmittingInsight(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Render sentiment indicators
  const renderSentimentBar = () => {
    if (!stockSentiment) return null;

    const { bullishPercentage, bearishPercentage, neutralPercentage } =
      stockSentiment.sentiment;

    return (
      <View style={styles.sentimentBar}>
        <View
          style={[
            styles.sentimentSegment,
            { width: `${bullishPercentage}%`, backgroundColor: "#19AF00" },
          ]}
        />
        <View
          style={[
            styles.sentimentSegment,
            { width: `${neutralPercentage}%`, backgroundColor: "#888888" },
          ]}
        />
        <View
          style={[
            styles.sentimentSegment,
            { width: `${bearishPercentage}%`, backgroundColor: "#D92A2A" },
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginVertical: 16,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.header}>Hedera AI Insights</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : (
          <>
            {/* Portfolio Insights Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Portfolio AI Insights</Text>
              <Text style={styles.sectionSubtitle}>
                Powered by Hedera Agent Kit
              </Text>

              {portfolioInsights ? (
                <View style={styles.insightsContainer}>
                  <Text style={styles.portfolioValue}>
                    Portfolio Value: {portfolioInsights.portfolioValue} KES
                  </Text>

                  {portfolioInsights.recommendations?.map((rec, index) => (
                    <View key={index} style={styles.recommendationCard}>
                      <View style={styles.recommendationHeader}>
                        <Text style={styles.recommendationType}>
                          {rec.type === "buy"
                            ? "🟢 BUY"
                            : rec.type === "sell"
                            ? "🔴 SELL"
                            : "🟡 HOLD"}
                        </Text>
                        <Text style={styles.recommendationStock}>
                          {rec.stockCode}
                        </Text>
                      </View>
                      <Text style={styles.recommendationReason}>
                        {rec.reason}
                      </Text>
                      {rec.confidence && (
                        <Text style={styles.recommendationConfidence}>
                          Confidence: {rec.confidence}%
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>
                  No portfolio insights available
                </Text>
              )}
            </View>

            {/* Market Sentiment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Market Sentiment</Text>
              <Text style={styles.sectionSubtitle}>
                Powered by Hedera Consensus Service
              </Text>

              {/* Stock selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.stockSelector}
              >
                {userStocks.map((stockCode) => (
                  <TouchableOpacity
                    key={stockCode}
                    style={[
                      styles.stockChip,
                      selectedStock === stockCode && styles.selectedStockChip,
                    ]}
                    onPress={() => handleSelectStock(stockCode)}
                  >
                    <Text
                      style={[
                        styles.stockChipText,
                        selectedStock === stockCode &&
                          styles.selectedStockChipText,
                      ]}
                    >
                      {stockCode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected stock sentiment */}
              {selectedStock ? (
                stockSentiment ? (
                  <View style={styles.sentimentContainer}>
                    <Text style={styles.stockName}>
                      {stockSentiment.stockName}
                    </Text>
                    <Text style={styles.stockPrice}>
                      KES {stockSentiment.currentPrice.toFixed(2)}
                      <Text
                        style={{
                          color:
                            stockSentiment.change > 0 ? "#19AF00" : "#D92A2A",
                        }}
                      >
                        {" "}
                        {stockSentiment.change > 0 ? "▲" : "▼"}{" "}
                        {Math.abs(stockSentiment.changePercent).toFixed(2)}%
                      </Text>
                    </Text>

                    {renderSentimentBar()}

                    <View style={styles.sentimentStats}>
                      <View style={styles.sentimentStat}>
                        <Text
                          style={[styles.sentimentValue, { color: "#19AF00" }]}
                        >
                          {stockSentiment.sentiment.bullishPercentage}%
                        </Text>
                        <Text style={styles.sentimentLabel}>Bullish</Text>
                      </View>
                      <View style={styles.sentimentStat}>
                        <Text
                          style={[styles.sentimentValue, { color: "#888888" }]}
                        >
                          {stockSentiment.sentiment.neutralPercentage}%
                        </Text>
                        <Text style={styles.sentimentLabel}>Neutral</Text>
                      </View>
                      <View style={styles.sentimentStat}>
                        <Text
                          style={[styles.sentimentValue, { color: "#D92A2A" }]}
                        >
                          {stockSentiment.sentiment.bearishPercentage}%
                        </Text>
                        <Text style={styles.sentimentLabel}>Bearish</Text>
                      </View>
                    </View>

                    {/* Recent insights */}
                    {stockSentiment.recentInsights?.length > 0 && (
                      <View style={styles.recentInsights}>
                        <Text style={styles.recentInsightsTitle}>
                          Recent Community Insights
                        </Text>
                        {stockSentiment.recentInsights.map((insight, index) => (
                          <View key={index} style={styles.insightCard}>
                            <Text style={styles.insightContent}>
                              {insight.content}
                            </Text>
                            <Text style={styles.insightTimestamp}>
                              {new Date(insight.timestamp).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Submit new insight */}
                    <View style={styles.submitInsightContainer}>
                      <Text style={styles.submitInsightTitle}>
                        Share Your Market Insight
                      </Text>
                      <TextInput
                        style={styles.insightInput}
                        value={insightInput}
                        onChangeText={setInsightInput}
                        placeholder="What do you think about this stock?"
                        multiline
                      />
                      <TouchableOpacity
                        style={[
                          styles.submitButton,
                          (!insightInput.trim() || submittingInsight) &&
                            styles.disabledButton,
                        ]}
                        onPress={submitInsight}
                        disabled={!insightInput.trim() || submittingInsight}
                      >
                        {submittingInsight ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.submitButtonText}>
                            Submit to Hedera Network
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>
                    No sentiment data available for {selectedStock}
                  </Text>
                )
              ) : (
                <Text style={styles.noDataText}>
                  Select a stock to view sentiment
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Agent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    textAlign: "center",
    color: Colors.light.titles,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f6f7f9",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    marginBottom: 4,
    color: Colors.light.titles,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  noDataText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: "center",
    marginVertical: 20,
  },
  insightsContainer: {
    gap: 12,
  },
  portfolioValue: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationType: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginRight: 8,
  },
  recommendationStock: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  recommendationReason: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationConfidence: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.light.muted,
  },
  stockSelector: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stockChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e6e6e6",
    borderRadius: 20,
    marginRight: 8,
  },
  selectedStockChip: {
    backgroundColor: Colors.light.primary,
  },
  stockChipText: {
    fontFamily: fonts.regular,
    color: Colors.light.titles,
  },
  selectedStockChipText: {
    color: "#fff",
  },
  sentimentContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  stockName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginBottom: 4,
  },
  stockPrice: {
    fontFamily: fonts.regular,
    fontSize: 16,
    marginBottom: 16,
  },
  sentimentBar: {
    height: 8,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  sentimentSegment: {
    height: "100%",
  },
  sentimentStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sentimentStat: {
    alignItems: "center",
  },
  sentimentValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  sentimentLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.light.muted,
  },
  recentInsights: {
    marginTop: 16,
  },
  recentInsightsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: "#f6f7f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  insightContent: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: 4,
  },
  insightTimestamp: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.light.muted,
  },
  submitInsightContainer: {
    marginTop: 24,
  },
  submitInsightTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    marginBottom: 8,
  },
  insightInput: {
    backgroundColor: "#f6f7f9",
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 12,
    fontFamily: fonts.regular,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: fonts.semiBold,
    color: "#fff",
    fontSize: 16,
  },
});

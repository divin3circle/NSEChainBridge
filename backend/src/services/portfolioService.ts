import { HederaAgentKit } from "hedera-agent-kit";
import User from "../models/User";
import {
  simulatedStockData,
  stockPredictions,
} from "../data/simulatedMarketData";
import hcsService from "./hcsService";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  Hbar,
  PrivateKey,
} from "@hashgraph/sdk";

// Define types for our data structures
interface MarketData {
  [stockCode: string]: {
    currentPrice: number;
    change: number;
    changePercent: number;
    weeklyTrend: string;
    monthlyTrend: string;
    volatility: number;
    recentPrices: number[];
    prediction: any;
  };
}

interface CommunityInsights {
  [stockCode: string]: any[];
}

interface TokenHolding {
  tokenId: string;
  stockCode: string;
  balance: number;
  lockedQuantity: number;
  estimatedValueKES: number;
}

interface Recommendation {
  stockCode: string;
  action: string;
  confidence: string;
  reason: string;
  type: string;
}

class PortfolioService {
  async getPortfolioInsights(
    userId: string,
    accountId: string,
    privateKey: string
  ) {
    try {
      // Initialize Hedera Agent Kit with user credentials
      const hederaKit = new HederaAgentKit(accountId, privateKey, "testnet");

      // Get user data
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      // Get on-chain data
      // Since getAccountBalance is not directly available in HederaAgentKit
      // We'll use the Hedera SDK directly
      let hbarBalance = 0;
      try {
        const client = Client.forTestnet();
        client.setOperator(
          AccountId.fromString(accountId),
          PrivateKey.fromStringECDSA(privateKey)
        );

        const balance = await new AccountBalanceQuery()
          .setAccountId(AccountId.fromString(accountId))
          .execute(client);

        // Convert from Hbar to decimal
        hbarBalance = balance.hbars.toTinybars().toNumber() / 100000000;

        client.close();
      } catch (error) {
        console.error("Error getting account balance:", error);
        // Use a default value if balance fetch fails
        hbarBalance = 0;
      }

      // Get market data for relevant stocks
      const userStockCodes: string[] = user.stockHoldings.map(
        (h: any) => h.stockCode
      );
      const marketData: MarketData = {};
      const communityInsights: CommunityInsights = {};

      // Collect data for each stock the user holds
      for (const stockCode of userStockCodes) {
        // Get simulated market data
        if (simulatedStockData[stockCode]) {
          marketData[stockCode] = {
            currentPrice: simulatedStockData[stockCode].currentPrice,
            change: simulatedStockData[stockCode].change,
            changePercent: simulatedStockData[stockCode].changePercent,
            weeklyTrend: simulatedStockData[stockCode].weeklyTrend,
            monthlyTrend: simulatedStockData[stockCode].monthlyTrend,
            volatility:
              typeof simulatedStockData[stockCode].volatility === "string"
                ? parseFloat(simulatedStockData[stockCode].volatility)
                : simulatedStockData[stockCode].volatility,
            recentPrices: simulatedStockData[stockCode].history
              .slice(-7)
              .map((h: any) => h.close),
            prediction:
              stockPredictions[stockCode as keyof typeof stockPredictions] ||
              null,
          };
        }

        // Get community insights from HCS
        try {
          const insights = await hcsService.getInsightsForStock(stockCode, 10);
          communityInsights[stockCode] = insights;
        } catch (error) {
          console.error(`Error getting insights for ${stockCode}:`, error);
          communityInsights[stockCode] = [];
        }
      }

      // Format token holdings for easier AI processing
      const formattedTokenHoldings: TokenHolding[] = user.tokenHoldings.map(
        (holding: any) => {
          const stockCode = Object.keys(simulatedStockData).find(
            (code) =>
              simulatedStockData[code].name === holding.tokenId.split("-")[0]
          );

          return {
            tokenId: holding.tokenId,
            stockCode: stockCode || "Unknown",
            balance: holding.balance,
            lockedQuantity: holding.lockedQuantity,
            estimatedValueKES: stockCode
              ? holding.balance * simulatedStockData[stockCode].currentPrice
              : 0,
          };
        }
      );

      // Generate portfolio recommendations based on the data
      const recommendations = this.generateRecommendations(
        userStockCodes,
        marketData,
        communityInsights
      );

      const insightCounts: Record<string, number> = {};
      Object.entries(communityInsights).forEach(([code, insights]) => {
        const insightsArray = insights as any[];
        insightCounts[code] = insightsArray.length;
      });

      return {
        hbarBalance,
        tokenHoldings: formattedTokenHoldings,
        stockHoldings: user.stockHoldings,
        marketData,
        recommendations,
        communityInsightCounts: insightCounts,
        portfolioValue: formattedTokenHoldings.reduce(
          (sum, token) => sum + token.estimatedValueKES,
          0
        ),
      };
    } catch (error) {
      console.error("Error generating portfolio insights:", error);
      throw error;
    }
  }

  private generateRecommendations(
    userStockCodes: string[],
    marketData: MarketData,
    communityInsights: CommunityInsights
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Simple recommendation logic based on market data and community sentiment
    userStockCodes.forEach((stockCode) => {
      const data = marketData[stockCode];
      const insights = communityInsights[stockCode] || [];

      if (!data) return;

      // Count bullish vs bearish sentiment in community insights
      let bullish = 0,
        bearish = 0;
      insights.forEach((insight: any) => {
        const content = insight.content.toLowerCase();
        if (
          content.includes("bullish") ||
          content.includes("buy") ||
          content.includes("growth") ||
          content.includes("increase")
        ) {
          bullish++;
        } else if (
          content.includes("bearish") ||
          content.includes("sell") ||
          content.includes("drop") ||
          content.includes("decrease")
        ) {
          bearish++;
        }
      });

      // Market trend triggers recommendations
      if (
        data.weeklyTrend === "up" &&
        data.prediction?.shortTerm?.prediction === "upward"
      ) {
        recommendations.push({
          stockCode,
          action: "BUY",
          confidence: "HIGH",
          reason: `${stockCode} shows strong upward momentum with positive short-term outlook.`,
          type: "buy",
        });
      } else if (
        data.weeklyTrend === "down" &&
        data.prediction?.shortTerm?.prediction === "downward"
      ) {
        recommendations.push({
          stockCode,
          action: "SELL",
          confidence: "MEDIUM",
          reason: `Consider reducing exposure to ${stockCode} as both short-term trends and predictions are negative.`,
          type: "sell",
        });
      } else if (
        data.weeklyTrend === "down" &&
        data.prediction?.shortTerm?.prediction === "upward"
      ) {
        recommendations.push({
          stockCode,
          action: "BUY",
          confidence: "MEDIUM",
          reason: `${stockCode} is currently in a dip but expected to recover soon - potential buying opportunity.`,
          type: "buy",
        });
      }

      // Community sentiment might override market data
      if (bullish > bearish * 2 && insights.length >= 5) {
        const existingRec = recommendations.find(
          (r) => r.stockCode === stockCode
        );
        if (existingRec) {
          existingRec.confidence = "HIGH";
          existingRec.reason += ` Community sentiment strongly supports this view (${bullish} bullish vs ${bearish} bearish opinions).`;
        } else {
          recommendations.push({
            stockCode,
            action: "BUY",
            confidence: "MEDIUM",
            reason: `Strong community bullish sentiment for ${stockCode} (${bullish} bullish vs ${bearish} bearish opinions).`,
            type: "buy",
          });
        }
      } else if (bearish > bullish * 2 && insights.length >= 5) {
        const existingRec = recommendations.find(
          (r) => r.stockCode === stockCode
        );
        if (existingRec && existingRec.action === "SELL") {
          existingRec.confidence = "HIGH";
          existingRec.reason += ` Community sentiment strongly supports this view (${bearish} bearish vs ${bullish} bullish opinions).`;
        } else if (existingRec && existingRec.action === "BUY") {
          // Community disagrees with market data - note this
          existingRec.confidence = "LOW";
          existingRec.reason += ` Note: Community sentiment is mostly bearish (${bearish} bearish vs ${bullish} bullish opinions), contradicting market indicators.`;
        } else {
          recommendations.push({
            stockCode,
            action: "SELL",
            confidence: "MEDIUM",
            reason: `Strong community bearish sentiment for ${stockCode} (${bearish} bearish vs ${bullish} bullish opinions).`,
            type: "sell",
          });
        }
      }
    });

    return recommendations;
  }
}

export default new PortfolioService();

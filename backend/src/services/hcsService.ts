// services/hcsService.ts
import { HederaAgentKit } from "hedera-agent-kit";
import StockTopic from "../models/StockTopic";
import MarketInsight from "../models/MarketInsight";
import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessage,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

class HCSService {
  private hederaKit: HederaAgentKit;

  private operatorId = "0.0.5483001";
  private operatorKey =
    "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0";

  constructor() {
    this.hederaKit = new HederaAgentKit(
      this.operatorId,
      this.operatorKey,
      "testnet"
    );
  }

  async createTopicForStock(stockCode: string, description: string) {
    let client;

    client = Client.forTestnet();

    client.setOperator(this.operatorId, this.operatorKey);

    const existingTopic = await StockTopic.findOne({ stockCode });
    if (existingTopic) return existingTopic.topicId;

    try {
      const txCreateTopic = new TopicCreateTransaction({
        topicMemo: `Market insights for ${stockCode}`,
        submitKey: undefined,
      });

      const txCreateTopicResponse = await txCreateTopic.execute(client);

      const receiptCreateTopicTx = await txCreateTopicResponse.getReceipt(
        client
      );

      const statusCreateTopicTx = receiptCreateTopicTx.status;

      const txCreateTopicId = txCreateTopicResponse.transactionId.toString();

      let topicId = "";

      if (receiptCreateTopicTx.topicId) {
        topicId = receiptCreateTopicTx.topicId.toString();
        console.log(
          "------------------------------ Create Topic ------------------------------ "
        );
        console.log(
          "Receipt status           :",
          statusCreateTopicTx.toString()
        );
        console.log("Transaction ID           :", txCreateTopicId);
        console.log(
          "Hashscan URL             :",
          "https://hashscan.io/testnet/tx/" + txCreateTopicId
        );
        console.log("Topic ID                 :", topicId);

        await StockTopic.create({
          stockCode,
          topicId,
          description,
        });
        console.log(`Created topic ${topicId} for stock ${stockCode}`);
        return topicId;
      }

      console.log("Error creating topic, topicId is undefined");
      return null;
    } catch (error) {
      console.error(error);
      throw new Error("Error creating topic");
    } finally {
      if (client) client.close();
    }
  }

  async submitInsight(
    userId: string,
    stockCode: string,
    insightType: string,
    content: string,
    accountId: string,
    privateKey: string
  ) {
    const topic = await StockTopic.findOne({ stockCode });
    if (!topic) {
      throw new Error(`No topic found for stock ${stockCode}`);
    }

    let client;
    try {
      const ACCOUNT_ID = AccountId.fromString(accountId);
      const PRIVATE_KEY = PrivateKey.fromStringECDSA(privateKey);

      client = Client.forTestnet();
      client.setOperator(ACCOUNT_ID, PRIVATE_KEY);

      const message = JSON.stringify({
        userId,
        type: insightType,
        content,
        timestamp: new Date().toISOString(),
      });

      const txTopicMessageSubmit = await new TopicMessageSubmitTransaction()
        .setTopicId(topic.topicId)
        .setMessage(message)
        .execute(client);

      const receipt = await txTopicMessageSubmit.getReceipt(client);

      console.log(
        "-------------------------------- Submit Message -------------------------------- "
      );
      console.log("Topic Message Status     : " + receipt.status);

      const timestamp = new Date();
      const messageId = txTopicMessageSubmit.transactionId.toString();

      // Store in database
      await MarketInsight.create({
        userId,
        stockCode,
        topicId: topic.topicId,
        messageId,
        insightType,
        content,
        createdAt: timestamp,
      });

      return {
        messageId,
        status: receipt.status.toString(),
        timestamp,
      };
    } catch (error: any) {
      console.error("Error submitting message:", error);
      throw new Error(`Error submitting insight: ${error.message}`);
    } finally {
      if (client) client.close();
    }
  }

  async getInsightsForStock(stockCode: string, limit = 20) {
    const topic = await StockTopic.findOne({ stockCode });
    if (!topic) {
      throw new Error(`No topic found for stock ${stockCode}`);
    }

    let client;
    try {
      const MY_ACCOUNT_ID = AccountId.fromString("0.0.5483001");
      const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
        "a21d310e140357b2b623fe74a9499af53d8847b1fd0f0b23376ef76d2ea0bce0"
      );

      client = Client.forTestnet();
      client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

      console.log(`Fetching messages for topic: ${topic.topicId}`);

      // Get stored insights from database as a fallback
      const storedInsights = await MarketInsight.find({
        stockCode,
        topicId: topic.topicId,
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      if (storedInsights.length > 0) {
        console.log(
          `Found ${storedInsights.length} stored insights in the database`
        );
        return storedInsights.map((insight) => ({
          userId: insight.userId,
          type: insight.insightType,
          content: insight.content,
          timestamp: insight.createdAt,
          consensusTimestamp: insight.createdAt,
          sequenceNumber: 0,
        }));
      }

      // If no stored insights, return empty array for now
      // In a production environment, you would implement a proper
      // mirror node query to get historical topic messages
      console.log("No insights found in database. Returning empty array.");
      return [];

      // Note: The proper implementation would use the Hedera Mirror Node REST API
      // to fetch historical topic messages, but this requires additional setup
    } catch (error: any) {
      console.error("Error getting insights for stock:", error);
      throw new Error(
        `Failed to get insights for ${stockCode}: ${error.message}`
      );
    } finally {
      if (client) client.close();
    }
  }

  async analyzeStockSentiment(stockCode: string) {
    const insights = await this.getInsightsForStock(stockCode, 100);

    // Simple sentiment analysis (enhance this with AI later)
    let bullish = 0,
      bearish = 0,
      neutral = 0;

    insights.forEach((insight: { content: string }) => {
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
      } else {
        neutral++;
      }
    });

    const total = bullish + bearish + neutral || 1; // Avoid division by zero

    return {
      bullishPercentage: Math.round((bullish / total) * 100),
      bearishPercentage: Math.round((bearish / total) * 100),
      neutralPercentage: Math.round((neutral / total) * 100),
      messageCount: total,
      latestInsights: insights.slice(0, 5),
    };
  }
}

export default new HCSService();

import axios from "axios";

const API_URL = "http://localhost:5004/api"; // Adjust port if needed

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

class NeoService {
  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      console.error("Error making request to NEO client:", error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      const response = await this.makeRequest("/neo/chat", { message });
      return {
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error("Failed to send message to NEO client");
    }
  }
}

export const neoService = new NeoService();

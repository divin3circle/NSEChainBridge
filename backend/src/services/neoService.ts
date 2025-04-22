import axios from "axios";

const API_URL = "http://localhost:5004/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NeoResponse {
  content: string;
  timestamp: string;
}

class NeoService {
  private async makeRequest(endpoint: string, data: any) {
    try {
      const response = await axios.post<NeoResponse>(
        `${API_URL}${endpoint}`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error("Error making request to NEO client:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(error.response.data.error || "Server error");
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error("No response from server");
      } else {
        // Something happened in setting up the request
        throw new Error("Failed to make request");
      }
    }
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    try {
      const response = await this.makeRequest("/neo/chat", { message });
      return {
        role: "assistant",
        content: response.content,
        timestamp: new Date(response.timestamp),
      };
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}

export const neoService = new NeoService();

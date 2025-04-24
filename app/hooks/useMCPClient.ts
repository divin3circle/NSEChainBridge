import { useMutation, useQuery } from "@tanstack/react-query";

interface MCPQueryParams {
  query: string;
  userId: string;
  accountId: string;
  privateKey: string;
  userEmail: string;
  password: string;
}

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const MCP_API_URL = "http://localhost:4000/api/mcp";

// Query function for processing MCP queries
const processMCPQuery = async (
  params: MCPQueryParams
): Promise<MCPResponse> => {
  try {
    console.log("Sending MCP query with params:", {
      ...params,
      privateKey: "***", // Mask sensitive data in logs
      password: "***",
    });

    const response = await fetch(`${MCP_API_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("MCP query failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(
        `MCP query failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("MCP query response:", data);
    return data;
  } catch (error) {
    console.error("Error in processMCPQuery:", error);
    throw error;
  }
};

// Query function for fetching MCP tools
const fetchMCPTools = async (): Promise<MCPResponse> => {
  const response = await fetch(`${MCP_API_URL}/tools`);

  if (!response.ok) {
    throw new Error("Failed to fetch MCP tools");
  }

  return response.json();
};

export const useMCPClient = () => {
  // Query for fetching tools
  const toolsQuery = useQuery({
    queryKey: ["mcpTools"],
    queryFn: fetchMCPTools,
  });

  // Mutation for processing queries
  const queryMutation = useMutation({
    mutationFn: processMCPQuery,
  });

  return {
    tools: toolsQuery.data?.data,
    isLoadingTools: toolsQuery.isLoading,
    toolsError: toolsQuery.error,
    processQuery: (params: MCPQueryParams) => queryMutation.mutateAsync(params),
    isProcessingQuery: queryMutation.isPending,
    queryError: queryMutation.error,
  };
};

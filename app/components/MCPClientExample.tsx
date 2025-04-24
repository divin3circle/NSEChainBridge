import React, { useState } from "react";
import { useMCPClient } from "../hooks/useMCPClient";

export const MCPClientExample: React.FC = () => {
  const [query, setQuery] = useState("");
  const {
    tools,
    isLoadingTools,
    toolsError,
    processQuery,
    isProcessingQuery,
    queryError,
  } = useMCPClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real application, you would get these values from your auth system
    const params = {
      query,
      userId: "user123",
      accountId: "account123",
      privateKey: "your-private-key",
      userEmail: "user@example.com",
      password: "user-password",
    };

    processQuery(params);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">MCP Client Example</h2>

      {/* Tools Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Available Tools</h3>
        {isLoadingTools ? (
          <p>Loading tools...</p>
        ) : toolsError ? (
          <p className="text-red-500">
            Error loading tools: {toolsError.message}
          </p>
        ) : (
          <ul className="list-disc pl-5">
            {tools?.map((tool: any, index: number) => (
              <li key={index}>{tool.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-1">
            Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Enter your query..."
          />
        </div>

        <button
          type="submit"
          disabled={isProcessingQuery}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isProcessingQuery ? "Processing..." : "Submit Query"}
        </button>

        {queryError && (
          <p className="text-red-500">Error: {queryError.message}</p>
        )}
      </form>
    </div>
  );
};

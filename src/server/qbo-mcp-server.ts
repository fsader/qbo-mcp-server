import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class QuickbooksMCPServer {
  private static instance: McpServer | null = null;

  private constructor() {}

  /**
   * Build a fresh McpServer instance. Used by the remote HTTP entrypoint, where
   * each Streamable HTTP session needs its own server bound to its own
   * transport (an McpServer can only be connected to a single transport).
   */
  public static CreateServer(): McpServer {
    return new McpServer(
      {
        name: "QuickBooks Online MCP Server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Shared singleton instance. Used by the local stdio entrypoint, which
   * connects exactly one server to one stdio transport for the process
   * lifetime.
   */
  public static GetServer(): McpServer {
    if (QuickbooksMCPServer.instance === null) {
      QuickbooksMCPServer.instance = QuickbooksMCPServer.CreateServer();
    }
    return QuickbooksMCPServer.instance;
  }
}
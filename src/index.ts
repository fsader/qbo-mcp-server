#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { QuickbooksMCPServer } from "./server/qbo-mcp-server.js";
import {
  registerAllTools,
  logRegistrationSummary,
} from "./server/register-all-tools.js";

const main = async () => {
  // Create an MCP server
  const server = QuickbooksMCPServer.GetServer();

  // Safe tool gating: only register tools permitted by the current QBO_TOOL_MODE
  // (default: read). Delete tools require QBO_TOOL_MODE=all AND
  // QBO_ENABLE_DELETE_TOOLS=true. See src/helpers/tool-mode.ts.
  const result = registerAllTools(server);
  logRegistrationSummary(result);

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

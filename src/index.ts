#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, SERVER_NAME, SERVER_VERSION } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so stdout stays a clean MCP stream.
  console.error(`${SERVER_NAME} MCP server ${SERVER_VERSION} running on stdio`);
}

main().catch((err) => {
  console.error("Fatal error starting Blue Reacher MCP server:", err);
  process.exit(1);
});

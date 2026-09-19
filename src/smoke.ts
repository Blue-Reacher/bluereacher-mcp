// Smoke test: boot the server over an in-memory transport, connect a client,
// and confirm the expected tools are registered. Requires no API key and
// sends nothing. Run with: npm run smoke
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "./server.js";

const EXPECTED = [
  "send_imessage",
  "get_message_status",
  "list_conversations",
  "check_imessage_capability",
];

async function main(): Promise<void> {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "bluereacher-smoke", version: "0.0.0" });

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  console.log("Registered tools:", names.join(", "));

  const missing = EXPECTED.filter((n) => !names.includes(n));
  await client.close();
  await server.close();

  if (missing.length > 0) {
    console.error("FAIL: missing tools:", missing.join(", "));
    process.exit(1);
  }
  console.log(`OK: server booted and registered ${EXPECTED.length} tools.`);
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});

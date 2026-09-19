import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiRequest, clean, MissingKeyError } from "./api.js";

export const SERVER_NAME = "bluereacher";
export const SERVER_VERSION = "0.1.0";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Wrap a tool handler so a missing key or API error becomes a clean tool
 *  error instead of crashing the server. */
async function guard(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof MissingKeyError) return fail(err.message);
    return fail(`Blue Reacher request failed: ${(err as Error).message}`);
  }
}

function resultOrError(res: {
  ok: boolean;
  status: number;
  data: unknown;
}): ToolResult {
  if (!res.ok) {
    const d = (res.data ?? {}) as { error?: string; help?: string };
    const parts = [`Blue Reacher API error ${res.status}: ${d.error ?? "request failed"}`];
    if (d.help) parts.push(`Hint: ${d.help}`);
    return fail(parts.join("\n"));
  }
  return ok(res.data);
}

/**
 * Build the Blue Reacher MCP server with its tools registered. Sending uses a
 * dedicated iMessage line. Set BLUEREACHER_API_KEY in the environment; a
 * brk_test_ key hits the simulator so no message is ever sent.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "send_imessage",
    {
      title: "Send iMessage",
      description:
        "Send a text and/or media iMessage to an E.164 number over a Blue Reacher line. Paced (drip) by default; pass send_mode 'instant' to dispatch now.",
      inputSchema: {
        to: z.string().describe("Recipient phone number in E.164 format, e.g. +13035550101"),
        message: z.string().optional().describe("Message text. Required unless media_urls is set."),
        media_urls: z
          .array(z.string())
          .optional()
          .describe("1 to 10 https:// URLs to attach."),
        send_mode: z
          .enum(["drip", "instant"])
          .optional()
          .describe("drip (default) paces through the pipeline; instant dispatches now."),
        message_effect: z
          .string()
          .optional()
          .describe("Optional iMessage effect (instant only), e.g. confetti."),
      },
    },
    async (args) =>
      guard(async () => {
        const body = clean({
          to: args.to,
          message: args.message,
          media_urls: args.media_urls,
          send_mode: args.send_mode,
          message_effect: args.message_effect,
        });
        return resultOrError(await apiRequest("POST", "/messages", { body }));
      })
  );

  server.registerTool(
    "get_message_status",
    {
      title: "Get message status",
      description: "Look up the delivery status of a queued or sent Blue Reacher message by its id.",
      inputSchema: {
        message_id: z.string().describe("The message id returned by send_imessage."),
      },
    },
    async (args) =>
      guard(async () =>
        resultOrError(
          await apiRequest("GET", `/status/${encodeURIComponent(args.message_id)}`)
        )
      )
  );

  server.registerTool(
    "list_conversations",
    {
      title: "List conversation history",
      description:
        "Read recent conversation history for a phone number or group chat over a Blue Reacher line.",
      inputSchema: {
        phone: z.string().optional().describe("Phone number in E.164 format for a 1:1 thread."),
        group_chat_id: z.string().optional().describe("Group chat id for a group thread."),
        limit: z.number().int().positive().max(200).optional().describe("Max messages to return."),
      },
    },
    async (args) =>
      guard(async () =>
        resultOrError(
          await apiRequest("GET", "/conversations", {
            query: clean({
              phone: args.phone,
              group_chat_id: args.group_chat_id,
              limit: args.limit,
            }),
          })
        )
      )
  );

  server.registerTool(
    "check_imessage_capability",
    {
      title: "Check iMessage capability",
      description:
        "Check whether phone numbers can receive iMessage vs SMS. Accepts up to 100 numbers.",
      inputSchema: {
        phones: z
          .array(z.string())
          .min(1)
          .max(100)
          .describe("Phone numbers in E.164 format."),
      },
    },
    async (args) =>
      guard(async () =>
        resultOrError(
          await apiRequest("POST", "/capability", { body: { phones: args.phones } })
        )
      )
  );

  return server;
}

# bluereacher-mcp

[![Blue-Reacher/bluereacher-mcp MCP server](https://glama.ai/mcp/servers/Blue-Reacher/bluereacher-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Blue-Reacher/bluereacher-mcp)

A [Model Context Protocol](https://modelcontextprotocol.io) server for [Blue Reacher](https://bluereacher.com). It lets an AI agent send iMessage, check delivery status, read conversations, and check iMessage capability over a dedicated line.

- Built on the official `@modelcontextprotocol/sdk`, stdio transport
- Four tools: `send_imessage`, `get_message_status`, `list_conversations`, `check_imessage_capability`
- Reads your API key from the environment
- No A2P registration required

Docs: https://docs.bluereacher.com  
OpenAPI: https://docs.bluereacher.com/openapi.json

## Tools

| Tool | What it does |
| --- | --- |
| `send_imessage` | Send a text and/or media iMessage to an E.164 number. Paced by default, or instant. |
| `get_message_status` | Look up delivery status of a queued or sent message. |
| `list_conversations` | Read recent conversation history for a number or group. |
| `check_imessage_capability` | Check whether numbers can receive iMessage vs SMS. |

## Install and run

```bash
npm install
npm run build
BLUEREACHER_API_KEY=brk_test_your_key node dist/index.js
```

A test key (`brk_test_...`) hits the simulator, so no message is ever sent. Keep live keys (`brk_live_...`) in the environment, never in a committed config.

## Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bluereacher": {
      "command": "npx",
      "args": ["-y", "bluereacher-mcp"],
      "env": {
        "BLUEREACHER_API_KEY": "brk_test_your_key"
      }
    }
  }
}
```

Or point at a local build with `"command": "node"` and `"args": ["/absolute/path/to/dist/index.js"]`.

## Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "bluereacher": {
      "command": "npx",
      "args": ["-y", "bluereacher-mcp"],
      "env": {
        "BLUEREACHER_API_KEY": "brk_test_your_key"
      }
    }
  }
}
```

## Hosted MCP

Blue Reacher also runs a hosted MCP endpoint if you would rather not run this server yourself: `https://bluereacher.com/mcp` (and a public endpoint at `https://api.bluereacher.com/v1/mcp/public`). See the docs for details.

## Smoke test

Boots the server over an in-memory transport and confirms the tools register. Requires no API key and sends nothing.

```bash
npm run smoke
```

## License

MIT. Copyright 2026 Blue Reacher.

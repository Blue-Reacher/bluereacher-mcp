// Minimal fetch client for the Blue Reacher API, used by the MCP tools.
// Docs: https://docs.bluereacher.com

const DEFAULT_BASE_URL = "https://api.bluereacher.com/v1";

export class MissingKeyError extends Error {
  constructor() {
    super(
      "BLUEREACHER_API_KEY is not set. Provide a brk_live_ or brk_test_ key in the MCP server environment."
    );
    this.name = "MissingKeyError";
  }
}

export interface ApiResult {
  ok: boolean;
  status: number;
  data: unknown;
}

function baseUrl(): string {
  return (process.env.BLUEREACHER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export async function apiRequest(
  method: string,
  path: string,
  opts: { query?: Record<string, unknown>; body?: Record<string, unknown> } = {}
): Promise<ApiResult> {
  const key = process.env.BLUEREACHER_API_KEY;
  if (!key) throw new MissingKeyError();

  const url = new URL(baseUrl() + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "User-Agent": "bluereacher-mcp",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

/** Drop undefined values so they are never serialized. */
export function clean(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

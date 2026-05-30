#!/usr/bin/env node

/**
 * Remote HTTP entrypoint for Railway (and any other host that runs the server
 * over the network instead of stdio).
 *
 * Routes:
 *   GET  /health  — public. Returns only { status, mode }. No secrets.
 *   POST /mcp     — MCP Streamable HTTP. Requires Authorization: Bearer <MCP_SERVER_TOKEN>.
 *   GET  /mcp     — MCP Streamable HTTP SSE stream for an existing session (bearer required).
 *   DELETE /mcp   — terminate an MCP session (bearer required).
 *
 * The local stdio entrypoint (src/index.ts) is unchanged and unaffected; this
 * file is an additive, separate entrypoint started via `npm run start:http`.
 */

import http from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { QuickbooksMCPServer } from "./server/qbo-mcp-server.js";
import {
  registerAllTools,
  logRegistrationSummary,
} from "./server/register-all-tools.js";
import { loadToolModeConfig } from "./helpers/tool-mode.js";
import { checkBearer } from "./auth/bearer.js";

const PORT = Number(process.env.PORT ?? 3000);
const MCP_SERVER_TOKEN = process.env.MCP_SERVER_TOKEN ?? "";

// Reject requests with bodies larger than this (read-only v2-fast has no
// large payloads; raise deliberately when the attachment workstream lands).
const MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MB

if (!MCP_SERVER_TOKEN) {
  console.error(
    "[qbo-mcp-http] FATAL: MCP_SERVER_TOKEN is not set. Refusing to start an " +
      "unauthenticated remote MCP endpoint."
  );
  process.exit(1);
}

// One transport per active MCP session, keyed by the session id the transport
// generates on initialize.
const transports: Record<string, StreamableHTTPServerTransport> = {};

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Collect and JSON-parse a request body, enforcing the size cap. */
function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function handleMcp(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  // Bearer auth gate — applies to every /mcp method.
  if (!checkBearer(req.headers.authorization, MCP_SERVER_TOKEN)) {
    res.setHeader("WWW-Authenticate", "Bearer");
    sendJson(res, 401, {
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
    return;
  }

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (req.method === "POST") {
    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, {
        jsonrpc: "2.0",
        error: { code: -32700, message: "Invalid or too-large request body" },
        id: null,
      });
      return;
    }

    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Existing session.
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(body)) {
      // New session: build a fresh server, register tools, connect.
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
        },
      });
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = QuickbooksMCPServer.CreateServer();
      const result = registerAllTools(server);
      logRegistrationSummary(result);
      await server.connect(transport);
    } else {
      sendJson(res, 400, {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Bad Request: no valid session id, and not an initialize request",
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, body);
    return;
  }

  if (req.method === "GET" || req.method === "DELETE") {
    if (!sessionId || !transports[sessionId]) {
      sendJson(res, 400, {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: unknown session id" },
        id: null,
      });
      return;
    }
    await transports[sessionId].handleRequest(req, res);
    return;
  }

  res.writeHead(405, { Allow: "GET, POST, DELETE" });
  res.end();
}

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  // Public health check — only status + mode, never secrets or QBO data.
  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { status: "ok", mode: loadToolModeConfig().mode });
    return;
  }

  if (url.pathname === "/mcp") {
    handleMcp(req, res).catch((err) => {
      console.error("[qbo-mcp-http] error handling /mcp:", err);
      if (!res.headersSent) {
        sendJson(res, 500, {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    });
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

httpServer.listen(PORT, () => {
  console.error(
    `[qbo-mcp-http] listening on :${PORT} | mode=${loadToolModeConfig().mode} | ` +
      `health=GET /health | mcp=POST /mcp (bearer required)`
  );
});

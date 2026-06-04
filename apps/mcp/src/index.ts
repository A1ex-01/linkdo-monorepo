import "dotenv/config";

import { createServer, createTransport } from "./server.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { randomUUID } from "node:crypto";
const transports: Record<string, StreamableHTTPServerTransport> = {};
const PORT = parseInt(process.env.MCP_PORT ?? "3001", 10);
const HOST = process.env.MCP_HOST ?? "127.0.0.1";

async function main() {
  const http = await import("node:http");

  const srv = http.createServer(async (req, res) => {
    // Localhost-only check
    const remoteAddr = req.socket.remoteAddress ?? "";
    const isLocal =
      remoteAddr.startsWith("127.") ||
      remoteAddr.startsWith("::1") ||
      remoteAddr.startsWith("192.168.") ||
      remoteAddr.startsWith("10.");

    if (!isLocal) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: "Forbidden: remote connections not allowed" }),
      );
      return;
    }
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId) {
      // new session — create fresh transport + server
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          console.log(`Session initialized with ID: ${sessionId}`);
          transports[sessionId] = transport;
        },
      });
      const server = createServer();

      await server.connect(transport);
    }

    // Extract Bearer token and verify via backend /oauth/introspect
    const authHeader = req.headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        const token = match[1];
        if (token) {
          try {
            const { authProvider } = await import("./auth/provider.js");
            const authInfo = await authProvider.verifyAccessToken(token);
            console.log("🐽🐽 ~ index.ts ~ main ~ authInfo:", authInfo);
            (req as any).auth = authInfo;
          } catch {
            // Invalid token — MCP transport will reject with 401
          }
        }
      }
    }

    try {
      await transport.handleRequest(req as any, res as any);
    } catch (err) {
      console.error("[linkdo-mcp] Error handling request:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  srv.on("error", (err: Error) => {
    console.error("[linkdo-mcp] HTTP server error:", err);
    process.exit(1);
  });

  srv.listen(PORT, HOST, () => {
    console.log(
      `[linkdo-mcp] Link-Do MCP Server running at http://${HOST}:${PORT}/mcp`,
    );
    console.log(
      `[linkdo-mcp] OAuth authorization is handled by the Link-Do backend.`,
    );
    console.log(
      `[linkdo-mcp] LINKDO_API_BASE_URL: ${process.env.LINKDO_API_BASE_URL ?? "http://localhost:8080"}`,
    );
  });

  process.on("SIGINT", async () => {
    console.log("\n[linkdo-mcp] Shutting down...");
    for (const sessionId in transports) {
      try {
        console.log(`Closing transport for session ${sessionId}`);
        await transports[sessionId]!.close();
        delete transports[sessionId];
      } catch (error) {
        console.error(
          `Error closing transport for session ${sessionId}:`,
          error,
        );
      }
    }
    srv.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[linkdo-mcp] Fatal error:", err);
  process.exit(1);
});

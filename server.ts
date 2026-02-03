import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = new McpServer({
  name: "MCP Apps Hello World",
  version: "1.0.0",
});

const resourceUri = "ui://hello-world/app.html";

registerAppTool(
  server,
  "hello-world",
  {
    title: "Hello World",
    description:
      "Returns a greeting and renders a Hello World UI in MCP Apps hosts.",
    inputSchema: z.object({
      name: z.string().optional().describe("Optional name to greet."),
    }),
    _meta: { ui: { resourceUri } },
  },
  async (args) => {
    const name = typeof args?.name === "string" && args.name.trim()
      ? args.name.trim()
      : "World";
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}! If the UI is not available, this text confirms the tool ran successfully.`,
        },
      ],
    };
  },
);

registerAppResource(
  server,
  resourceUri,
  resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    let html: string;
    try {
      html = await fs.readFile(
        path.join(__dirname, "dist", "mcp-app.html"),
        "utf-8",
      );
    } catch (error) {
      html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MCP Apps Hello World</title>
  </head>
  <body>
    <p>UI bundle unavailable. Use the text response as fallback.</p>
  </body>
</html>`;
    }
    return {
      contents: [
        {
          uri: resourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
        },
      ],
    };
  },
);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = Number.parseInt(process.env.PORT ?? "", 10) || 3001;

app.listen(port, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`Server listening on http://localhost:${port}/mcp`);
});

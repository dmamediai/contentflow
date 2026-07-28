import { executeMCPTool, MCPContext } from "./router";

const PLATFORM_ENUM = ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "THREADS"];
const TONE_ENUM = ["professional", "casual", "funny", "engaging"];

/**
 * JSON-Schema input definitions for each tool, so MCP clients (Claude) know
 * the parameters. Mirrors the zod schemas inside each tool in mcp/tools/.
 */
export const TOOL_SCHEMAS: Record<string, { description: string; inputSchema: any }> = {
  generate_post: {
    description: "Generate an AI-powered social media post on a topic for a specific platform.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "What the post should be about" },
        platform: { type: "string", enum: PLATFORM_ENUM },
        tone: { type: "string", enum: TONE_ENUM },
        includeHashtags: { type: "boolean" },
        includeEmojis: { type: "boolean" },
        maxLength: { type: "number" },
      },
      required: ["topic", "platform"],
    },
  },
  rewrite_post: {
    description: "Rewrite existing content with a different tone or style.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        tone: { type: "string", enum: TONE_ENUM },
        platform: { type: "string", enum: PLATFORM_ENUM },
      },
      required: ["content"],
    },
  },
  generate_hashtags: {
    description: "Generate relevant hashtags for a piece of content.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        count: { type: "number", minimum: 1, maximum: 30 },
        platform: { type: "string", enum: PLATFORM_ENUM },
        includeNiche: { type: "boolean" },
      },
      required: ["content"],
    },
  },
  schedule_post: {
    description: "Schedule a post to publish at a specific time to connected accounts.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        scheduledAt: { type: "string", description: "ISO 8601 datetime" },
        socialAccountIds: { type: "array", items: { type: "string" } },
        mediaIds: { type: "array", items: { type: "string" } },
      },
      required: ["content", "scheduledAt", "socialAccountIds"],
    },
  },
  publish_post: {
    description: "Immediately publish a post to connected social accounts.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        socialAccountIds: { type: "array", items: { type: "string" } },
        mediaIds: { type: "array", items: { type: "string" } },
      },
      required: ["content", "socialAccountIds"],
    },
  },
  delete_post: {
    description: "Delete a scheduled or published post by id.",
    inputSchema: {
      type: "object",
      properties: { postId: { type: "string" } },
      required: ["postId"],
    },
  },
  get_analytics: {
    description: "Get engagement analytics for posts, optionally filtered by post or date range.",
    inputSchema: {
      type: "object",
      properties: {
        postId: { type: "string" },
        startDate: { type: "string", description: "ISO 8601 datetime" },
        endDate: { type: "string", description: "ISO 8601 datetime" },
      },
    },
  },
  connect_account: {
    description: "Connect a social media account to the team using an access token.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "THREADS"] },
        accessToken: { type: "string" },
        accountId: { type: "string" },
      },
      required: ["platform", "accessToken", "accountId"],
    },
  },
};

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "contentflow", version: "1.0.0" };

const ok = (id: any, result: any) => ({ jsonrpc: "2.0", id, result });
const err = (id: any, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

/**
 * Handle one JSON-RPC message per the MCP spec. Returns the response object,
 * or null for notifications (which get no response).
 */
export async function handleMcpMessage(msg: any, context: MCPContext): Promise<any | null> {
  const { id, method, params } = msg || {};

  if (typeof method !== "string") return err(id ?? null, -32600, "Invalid Request");
  if (method.startsWith("notifications/")) return null; // notifications: no reply

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case "ping":
      return ok(id, {});

    case "tools/list":
      return ok(id, {
        tools: Object.entries(TOOL_SCHEMAS).map(([name, s]) => ({
          name,
          description: s.description,
          inputSchema: s.inputSchema,
        })),
      });

    case "tools/call": {
      const name = params?.name;
      const args = params?.arguments || {};
      if (!name || !TOOL_SCHEMAS[name]) {
        return ok(id, { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true });
      }
      const result = await executeMCPTool(name, args, context);
      if (!result.success) {
        return ok(id, { content: [{ type: "text", text: result.error || "Tool failed" }], isError: true });
      }
      const text = typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2);
      return ok(id, { content: [{ type: "text", text }] });
    }

    default:
      return err(id ?? null, -32601, `Method not found: ${method}`);
  }
}

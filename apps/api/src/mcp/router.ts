import { generatePost } from "./tools/generate_post";
import { schedulePost } from "./tools/schedule_post";
import { publishPost } from "./tools/publish_post";
import { getAnalytics } from "./tools/analytics";
import { connectAccount } from "./tools/connect_account";
import { deletePost } from "./tools/delete_post";
import { rewritePost } from "./tools/rewrite_post";
import { generateHashtags } from "./tools/generate_hashtags";

export interface MCPContext {
  userId: string;
  teamId: string;
  email: string;
}

export interface MCPToolInput {
  [key: string]: any;
}

export interface MCPResult {
  success: boolean;
  tool: string;
  result?: any;
  error?: string;
}

export const mcpTools = {
  // AI Tools
  generate_post: generatePost,
  rewrite_post: rewritePost,
  generate_hashtags: generateHashtags,

  // Social Tools
  schedule_post: schedulePost,
  publish_post: publishPost,
  delete_post: deletePost,

  // Analytics
  get_analytics: getAnalytics,

  // Integration
  connect_account: connectAccount,
};

/**
 * Execute an MCP tool with context
 */
export async function executeMCPTool(
  toolName: string,
  input: MCPToolInput,
  context: MCPContext
): Promise<MCPResult> {
  if (!mcpTools[toolName as keyof typeof mcpTools]) {
    return {
      success: false,
      tool: toolName,
      error: `Tool '${toolName}' not found`,
    };
  }

  try {
    const toolFn = mcpTools[toolName as keyof typeof mcpTools];
    const result = await toolFn(input, context);

    return {
      success: true,
      tool: toolName,
      result,
    };
  } catch (error: any) {
    return {
      success: false,
      tool: toolName,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * List all available MCP tools
 */
export function listMCPTools() {
  return Object.keys(mcpTools).map((name) => ({
    name,
    description: getToolDescription(name),
  }));
}

function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    generate_post:
      "Generate AI-powered social media posts on a given topic for a specific platform",
    rewrite_post: "Rewrite an existing post with different tone or style",
    generate_hashtags: "Generate relevant hashtags for a post",
    schedule_post: "Schedule a post to be published at a specific time",
    publish_post: "Immediately publish a post to connected social accounts",
    delete_post: "Delete a scheduled or published post",
    get_analytics: "Get engagement analytics for posts",
    connect_account:
      "Connect a new social media account to the team",
  };

  return descriptions[toolName] || "Unknown tool";
}

import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";

const rewritePostSchema = z.object({
  content: z.string().min(1),
  tone: z.enum(["professional", "casual", "funny", "engaging"]).optional(),
  platform: z.enum(["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "THREADS"]).optional(),
});

export async function rewritePost(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = rewritePostSchema.parse(input);

  // TODO: Replace with actual AI call to rewrite content
  // const response = await callAI({
  //   instruction: `Rewrite this post in a ${validated.tone} tone`,
  //   content: validated.content
  // });

  return {
    originalContent: validated.content,
    rewrittenContent: `[Rewritten in ${validated.tone} tone] ${validated.content}`,
    tone: validated.tone || "engaging",
    platform: validated.platform,
  };
}

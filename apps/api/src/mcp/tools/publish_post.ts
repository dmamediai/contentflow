import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";
import prisma from "../../lib/db";

const publishPostSchema = z.object({
  content: z.string().min(1),
  socialAccountIds: z.array(z.string()).min(1),
  mediaIds: z.array(z.string()).optional(),
});

export async function publishPost(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = publishPostSchema.parse(input);

  // Create and immediately publish post
  const post = await prisma.post.create({
    data: {
      teamId: context.teamId,
      content: validated.content,
      contentType: "TEXT",
      status: "PUBLISHED",
      publishedAt: new Date(),
      socialAccounts: {
        connect: validated.socialAccountIds.map((id) => ({ id })),
      },
    },
    include: {
      socialAccounts: true,
    },
  });

  // TODO: Actually publish to social media APIs
  // for each socialAccount, call the appropriate API

  return {
    postId: post.id,
    content: post.content,
    publishedAt: post.publishedAt,
    platforms: post.socialAccounts.map((a) => a.platform),
    status: "published",
  };
}

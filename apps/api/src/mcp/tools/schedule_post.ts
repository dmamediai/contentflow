import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";
import prisma from "../../lib/db";

const schedulePostSchema = z.object({
  content: z.string().min(1),
  scheduledAt: z.string().datetime(),
  socialAccountIds: z.array(z.string()).min(1),
  mediaIds: z.array(z.string()).optional(),
});

export async function schedulePost(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = schedulePostSchema.parse(input);

  // Create post in database
  const post = await prisma.post.create({
    data: {
      teamId: context.teamId,
      content: validated.content,
      contentType: "TEXT",
      status: "SCHEDULED",
      scheduledAt: new Date(validated.scheduledAt),
      socialAccounts: {
        connect: validated.socialAccountIds.map((id) => ({ id })),
      },
    },
    include: {
      socialAccounts: true,
    },
  });

  return {
    postId: post.id,
    content: post.content,
    scheduledAt: post.scheduledAt,
    platforms: post.socialAccounts.map((a) => a.platform),
    status: "scheduled",
  };
}

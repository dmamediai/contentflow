import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";
import prisma from "../../lib/db";

const deletePostSchema = z.object({
  postId: z.string(),
});

export async function deletePost(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = deletePostSchema.parse(input);

  const post = await prisma.post.findUnique({
    where: { id: validated.postId },
  });

  if (!post || post.teamId !== context.teamId) {
    throw new Error("Post not found or access denied");
  }

  if (post.status === "PUBLISHED") {
    throw new Error("Cannot delete published posts");
  }

  await prisma.post.delete({
    where: { id: validated.postId },
  });

  return {
    success: true,
    postId: validated.postId,
    message: "Post deleted successfully",
  };
}

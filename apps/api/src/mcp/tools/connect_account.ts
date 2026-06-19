import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";

const connectAccountSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "THREADS"]),
  accessToken: z.string(),
  accountId: z.string(),
});

export async function connectAccount(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = connectAccountSchema.parse(input);

  // TODO: Validate token with platform API
  // TODO: Create SocialAccount in database

  return {
    success: true,
    platform: validated.platform,
    accountId: validated.accountId,
    connected: true,
    message: `Successfully connected ${validated.platform} account`,
  };
}

# ReplyWave MCP Production Server (Full Spec + Implementation)

You are building a production-grade MCP (Model Context Protocol) server for a SaaS platform called ReplyWave.

This MCP server allows Claude Code or any AI client to securely call tools like:
- generate social media posts
- schedule posts
- publish content
- fetch analytics
- manage integrations

---

# 1. SYSTEM OVERVIEW

Architecture:

Claude Code / AI Client
        ↓
MCP Server (THIS PROJECT)
        ↓
Auth Layer (API Keys)
        ↓
Tool Router (MCP Engine)
        ↓
Backend API (ReplyWave Core)
        ↓
Database (PostgreSQL / Supabase)
        ↓
External APIs (OpenAI, Meta, LinkedIn, etc.)

---

# 2. TECH STACK

- Node.js (Express)
- TypeScript
- PostgreSQL (Supabase compatible)
- Prisma ORM
- JWT (optional)
- API Key Authentication (required)
- Zod validation
- Rate limiting middleware
- Axios for API calls

---

# 3. CORE FEATURES

## MCP Capabilities

This server exposes tools:

### AI Tools
- generate_post
- rewrite_post
- generate_hashtags

### Social Tools
- schedule_post
- publish_post
- delete_post

### Analytics Tools
- get_analytics
- get_post_stats

### Integration Tools
- connect_social_account
- refresh_tokens

---

# 4. SECURITY MODEL

Every request MUST include:

Header:
x-api-key: rw_live_xxxxxxxxx

Rules:
- Reject invalid API keys
- Reject revoked keys
- Log every request
- Rate limit per API key
- Track usage per user

---

# 5. DATABASE (PRISMA)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  apiKeys   ApiKey[]
  createdAt DateTime @default(now())
}

model ApiKey {
  id         String   @id @default(cuid())
  key        String   @unique
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  revoked    Boolean  @default(false)
  lastUsedAt DateTime?
  createdAt  DateTime @default(now())
}

model RequestLog {
  id        String   @id @default(cuid())
  userId    String
  tool      String
  createdAt DateTime @default(now())
}
6. FOLDER STRUCTURE

replywave-mcp/
│
├── src/
│ ├── server.ts
│ ├── app.ts
│ ├── mcp/
│ │ ├── router.ts
│ │ ├── tools.ts
│ │ ├── tools/
│ │ │ ├── generate_post.ts
│ │ │ ├── schedule_post.ts
│ │ │ ├── publish_post.ts
│ │ │ ├── analytics.ts
│ │
│ ├── auth/
│ │ ├── apiKey.ts
│ │
│ ├── middleware/
│ │ ├── authMiddleware.ts
│ │ ├── rateLimit.ts
│ │
│ ├── services/
│ │ ├── openai.ts
│ │ ├── socialApi.ts
│
├── prisma/
│ ├── schema.prisma
│
├── package.json
├── tsconfig.json
├── .env

7. AUTH (API KEY SYSTEM)
validateApiKey.ts
import { prisma } from "../prisma";

export async function validateApiKey(key: string) {
  if (!key) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: true },
  });

  if (!apiKey || apiKey.revoked) return null;

  await prisma.apiKey.update({
    where: { key },
    data: { lastUsedAt: new Date() },
  });

  return apiKey.user;
}
8. AUTH MIDDLEWARE
import { validateApiKey } from "../auth/apiKey";

export async function authMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];

  const user = await validateApiKey(key);

  if (!user) {
    return res.status(401).json({
      error: "Invalid or missing API key",
    });
  }

  req.user = user;
  next();
}
9. MCP CORE SERVER
import express from "express";
import { authMiddleware } from "./middleware/authMiddleware";
import { tools } from "./mcp/router";

const app = express();
app.use(express.json());

app.post("/mcp", authMiddleware, async (req, res) => {
  try {
    const { tool, input } = req.body;

    if (!tools[tool]) {
      return res.status(400).json({ error: "Tool not found" });
    }

    const result = await tools[tool](input, req.user);

    res.json({
      success: true,
      tool,
      result,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("MCP Server running on port 3001");
});
10. MCP TOOL ROUTER
import { generatePost } from "./tools/generate_post";
import { schedulePost } from "./tools/schedule_post";
import { publishPost } from "./tools/publish_post";
import { analytics } from "./tools/analytics";

export const tools = {
  generate_post: generatePost,
  schedule_post: schedulePost,
  publish_post: publishPost,
  get_analytics: analytics,
};
11. EXAMPLE TOOL (AI POST GENERATION)
import axios from "axios";

export async function generatePost(input, user) {
  const { topic, platform } = input;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior social media marketer.",
        },
        {
          role: "user",
          content: `Write a ${platform} post about: ${topic}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
  };
}
12. RATE LIMITING
import rateLimit from "express-rate-limit";

export const mcpRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many requests",
});
13. API KEY GENERATOR
import crypto from "crypto";

export function generateApiKey() {
  return "rw_" + crypto.randomBytes(32).toString("hex");
}
14. MCP REQUEST FORMAT

Claude or client sends:

POST /mcp

Headers:
x-api-key: rw_live_xxx

Body:
{
"tool": "generate_post",
"input": {
"topic": "AI marketing",
"platform": "linkedin"
}
}

15. MCP RESPONSE FORMAT

{
"success": true,
"tool": "generate_post",
"result": {
"content": "..."
}
}

16. PRODUCTION RULES

MUST:

Validate API key on every request
Log every tool usage
Use rate limiting
Prevent revoked key usage
Never expose backend directly
Sanitize all inputs

SHOULD:

Add Redis queue for scheduling
Add webhook system
Add analytics logging
Add multi-tenant support
17. FUTURE UPGRADE PATH
OAuth Social Media Integration (Meta, LinkedIn, X)
Background job system (BullMQ)
Multi-workspace SaaS
Stripe billing per usage
AI agents (marketing, sales, SEO)
n8n automation integration


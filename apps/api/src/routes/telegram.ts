import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { TelegramService } from "../services/telegram.service";
import { MediaGenerationService } from "../services/media-generation.service";
import { MediaService } from "../services/media.service";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const HELP = [
  "*ContentFlow Studio* 🎨",
  "",
  "Send me a prompt and I'll generate media:",
  "• Just type a description → I'll make an *image*",
  "• `/video a cinematic drone shot of ocean waves` → a *video*",
  "• `/image a red panda barista` → force image",
  "",
  "Videos take ~1–2 min — I'll send it here when it's ready.",
].join("\n");

function parseMessage(text: string): { kind: "help" | "image" | "video"; prompt: string } {
  const m = /^\/(image|img|video|vid|start|help)\b\s*([\s\S]*)$/i.exec(text.trim());
  if (m) {
    const cmd = m[1].toLowerCase();
    const prompt = m[2].trim();
    if (cmd === "start" || cmd === "help") return { kind: "help", prompt: "" };
    if (cmd === "image" || cmd === "img") return { kind: "image", prompt };
    return { kind: "video", prompt };
  }
  return { kind: "image", prompt: text.trim() }; // plain text → image
}

async function handleImage(chatId: number, prompt: string) {
  if (!prompt) {
    await TelegramService.sendMessage(chatId, "Send a description, e.g. `a red panda barista`");
    return;
  }
  const teamId = await TelegramService.resolveTeamId();
  if (!teamId) return TelegramService.sendMessage(chatId, "No workspace is configured for the bot.");

  await TelegramService.sendChatAction(chatId, "upload_photo");
  try {
    const gen = await MediaGenerationService.create(teamId, {
      type: "image",
      prompt,
      aspectRatio: "1:1",
      mode: "Vivid",
    });
    if (gen.outputUrl && !gen.outputUrl.startsWith("data:")) {
      await TelegramService.sendPhoto(chatId, gen.outputUrl, prompt);
    } else {
      await TelegramService.sendMessage(chatId, "Generated, but I couldn't attach the image. Check the Media library in the app.");
    }
  } catch (error: any) {
    await TelegramService.sendMessage(chatId, error?.message || "Image generation failed.");
  }
}

async function handleVideo(chatId: number, prompt: string) {
  if (!prompt) {
    await TelegramService.sendMessage(chatId, "Send a description after /video, e.g. `/video ocean waves at sunset`");
    return;
  }
  const teamId = await TelegramService.resolveTeamId();
  if (!teamId) return TelegramService.sendMessage(chatId, "No workspace is configured for the bot.");

  await TelegramService.sendChatAction(chatId, "upload_video");
  try {
    const base = process.env.API_URL || "https://api-ashen-beta-38.vercel.app";
    await MediaGenerationService.create(teamId, {
      type: "video",
      prompt,
      aspectRatio: "9:16",
      duration: 5,
      mode: "Fast",
      callbackUrl: `${base}/api/telegram/video-callback`,
      telegramChatId: chatId,
    });
    await TelegramService.sendMessage(chatId, "🎬 Generating your video — I'll send it here when it's ready (~1–2 min).");
  } catch (error: any) {
    await TelegramService.sendMessage(chatId, error?.message || "Video generation failed to start.");
  }
}

// POST /api/telegram/webhook - Telegram sends updates here
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
      return res.status(401).json({ ok: false });
    }

    const message = req.body?.message || req.body?.edited_message;
    const text: string | undefined = message?.text;
    const chatId: number | undefined = message?.chat?.id;

    if (!text || chatId == null) return res.json({ ok: true });

    if (!TelegramService.isAllowed(chatId)) {
      await TelegramService.sendMessage(chatId, "This bot is private.");
      return res.json({ ok: true });
    }

    const { kind, prompt } = parseMessage(text);
    if (kind === "help") await TelegramService.sendMessage(chatId, HELP);
    else if (kind === "video") await handleVideo(chatId, prompt);
    else await handleImage(chatId, prompt);

    res.json({ ok: true });
  })
);

// POST /api/telegram/video-callback - Seedancee2 calls this when a video finishes
router.post(
  "/video-callback",
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body?.data;
    if (data?.id) {
      const gen = await prisma.generation.findFirst({ where: { providerJobId: data.id } });
      if (gen) {
        const chatId = (gen.params as any)?.telegramChatId;
        if (data.status === "completed") {
          const url = data.output?.video_url;
          if (url) {
            await prisma.generation.update({ where: { id: gen.id }, data: { status: "COMPLETED", outputUrl: url } });
            try {
              await MediaService.createMedia({
                teamId: gen.teamId,
                name: gen.prompt.slice(0, 80),
                type: "VIDEO",
                url,
                size: 0,
                mimeType: "video/mp4",
                isAiGenerated: true,
                aiModel: gen.model,
                aiPrompt: gen.prompt,
              });
            } catch {
              /* best-effort */
            }
            if (chatId) await TelegramService.sendVideo(chatId, url, gen.prompt);
          }
        } else if (data.status === "failed") {
          await prisma.generation.update({
            where: { id: gen.id },
            data: { status: "FAILED", error: data.error?.message || "Video generation failed" },
          });
          if (chatId) await TelegramService.sendMessage(chatId, "❌ Sorry, that video generation failed. Try a different prompt.");
        }
      }
    }
    res.json({ ok: true });
  })
);

export default router;

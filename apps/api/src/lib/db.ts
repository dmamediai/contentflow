import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    logger.debug(`Query: ${e.query} (${e.duration}ms)`);
  });

  prisma.$on("error", (e) => {
    logger.error(`Error: ${e.message}`);
  });

  prisma.$on("warn", (e) => {
    logger.warn(`Warning: ${e.message}`);
  });
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

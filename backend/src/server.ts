/// <reference path="./types/express.d.ts" />

import { app } from "./backendApp";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { startCronJobs } from "./config/cron";

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
  startCronJobs();
});

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

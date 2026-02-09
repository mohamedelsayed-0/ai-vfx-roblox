import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoute } from "./routes/health.js";
import { generateRoute } from "./routes/generate.js";

const port = parseInt(process.env["PORT"] || "3000", 10);

const app = Fastify({
  logger: { level: "info" },
});

await app.register(cors, { origin: true });
await app.register(healthRoute);
await app.register(generateRoute);

try {
  await app.listen({ port, host: "127.0.0.1" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    await app.close();
    process.exit(0);
  });
}

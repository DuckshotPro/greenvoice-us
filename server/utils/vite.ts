import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../../vite.config";
import { nanoid } from "nanoid";

const logger = createLogger();

/**
 * Logs messages with a timestamp and source.
 * @param {string} message - Message to be logged.
 * @param {string} [source="express"] - The source of the log message.
 */
export function log(message: string, source = "express") {
  logger.info(`${source}: ${message}`);
}

/**
 * Sets up Vite server with middleware for Hot Module Replacement.
 * @param {Express} app - An instance of the Express application.
 * @param {Server} server - The HTTP server instance.
 */
export async function setupVite(app: Express, server: Server) {
  // create vite server in middleware mode
  const vite = await createViteServer({
    server: {
      hmr: {
        server,
      },
      middlewareMode: true,
    },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (_, res) => {
    res.sendFile(path.resolve("client/index.html"));
  });
}

/**
 * Serves static files from the build directory.
 * Throws an error if the build directory is not found.
 * @param {Express} app - An instance of the Express application.
 */
export function serveStatic(app: Express) {
  if (!fs.existsSync(path.resolve("client/dist/index.html"))) {
    throw new Error(
      "Attempted to serve static files but no build directory was found, did you forget to run `npm run build`?",
    );
  }
  app.use(express.static(path.resolve("client/dist")));
  app.use("*", (_, res) => {
    res.sendFile(path.resolve("client/dist/index.html"));
  });
}
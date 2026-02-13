import { CommandRegistry } from "./commands/registry.js";
import { createHelpCommand } from "./commands/help.js";
import { createExitCommand } from "./commands/exit.js";
import { createGenerateCommand } from "./commands/generate.js";
import { createPreviewCommand } from "./commands/preview.js";
import { createApplyCommand } from "./commands/apply.js";
import { createRevertCommand } from "./commands/revert.js";
import { createConfigCommand } from "./commands/config.js";
import { createPresetsCommand } from "./commands/presets.js";
import { createModifyCommand } from "./commands/modify.js";
import { startRepl } from "./repl/repl.js";
import { startWsServer, stopWsServer, broadcast, onCommand } from "./ui/ws-server.js";
import { launchUI, killUI } from "./ui/launch.js";
import { spawnBackend, killBackend } from "./backend/spawn.js";
import { healthCheck } from "./backend/client.js";

import { resolve } from "node:path";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";

async function loadGeminiKey(): Promise<string | undefined> {
  const configPath = resolve(homedir(), ".vfxcopilot", "config.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    return config.geminiApiKey;
  } catch {
    return undefined;
  }
}

export async function main(): Promise<void> {
  const geminiKey = await loadGeminiKey();
  if (geminiKey) {
    process.env["GEMINI_API_KEY"] = geminiKey;
  }
  const registry = new CommandRegistry();

  let rl: { close: () => void } | undefined;

  const cleanup = () => {
    rl?.close();
    killUI();
    killBackend();
    stopWsServer();
  };

  // Register commands
  registry.register(createHelpCommand(registry));
  registry.register(createGenerateCommand());
  registry.register(createModifyCommand());
  registry.register(createPreviewCommand());
  registry.register(createApplyCommand());
  registry.register(createRevertCommand());
  registry.register(createPresetsCommand());
  registry.register(createConfigCommand());
  registry.register(createExitCommand(cleanup));

  // Banner
  console.log();
  console.log("  VFX Copilot v0.1.0 — AI-powered VFX for Roblox Studio");
  console.log("  Type /help for available commands.");
  console.log();

  // Start backend server
  spawnBackend(3000);
  console.log("  [Backend starting on :3000]");

  // Wait for backend to be ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await healthCheck()) {
      ready = true;
      break;
    }
  }
  if (ready) {
    console.log("  [Backend ready]");
  } else {
    console.log("  [Backend failed to start — generation will not work]");
  }

  // Start WebSocket server for UI sync
  onCommand(async (raw) => {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("/")) {
      broadcast({ type: "commandError", message: "Commands must start with /" });
      return;
    }
    const parts = trimmed.slice(1).split(/\s+/);
    const cmdName = parts[0]!;
    const args = parts.slice(1).join(" ");
    const cmd = registry.get(cmdName);
    if (!cmd) {
      broadcast({ type: "commandError", message: `Unknown command: /${cmdName}` });
      return;
    }
    // Capture console output during handler execution
    const logs: string[] = [];
    const origLog = console.log;
    const origError = console.error;
    console.log = (...a: unknown[]) => {
      const line = a.map(String).join(" ");
      logs.push(line);
      origLog(...a);
    };
    console.error = (...a: unknown[]) => {
      const line = a.map(String).join(" ");
      logs.push(line);
      origError(...a);
    };
    try {
      await cmd.handler(args);
      broadcast({ type: "commandOutput", command: cmdName, output: logs.join("\n") });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      broadcast({ type: "commandError", message });
    } finally {
      console.log = origLog;
      console.error = origError;
    }
  });
  const wss = startWsServer(3001);
  wss.on("connection", (ws) => {
    const commands = registry.getAll().map((c) => ({
      name: c.name,
      description: c.description,
      usage: c.usage,
    }));
    ws.send(JSON.stringify({ type: "commandList", commands }));
    ws.send(JSON.stringify({ type: "status", status: "idle" }));
  });

  // Launch Electron UI
  const ui = launchUI();
  if (ui) {
    console.log("  [UI window launched]");
  } else {
    console.log("  [UI unavailable — running in terminal-only mode]");
  }
  console.log();

  // Start REPL
  rl = await startRepl(registry);
}

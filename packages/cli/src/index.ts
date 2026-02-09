import { CommandRegistry } from "./commands/registry.js";
import { createHelpCommand } from "./commands/help.js";
import { createExitCommand } from "./commands/exit.js";
import { createGenerateCommand } from "./commands/generate.js";
import { createPreviewCommand } from "./commands/preview.js";
import { createApplyCommand } from "./commands/apply.js";
import { createRevertCommand } from "./commands/revert.js";
import { startRepl } from "./repl/repl.js";
import { startWsServer, stopWsServer } from "./ui/ws-server.js";
import { launchUI, killUI } from "./ui/launch.js";
import { spawnBackend, killBackend } from "./backend/spawn.js";
import { healthCheck } from "./backend/client.js";

export async function main(): Promise<void> {
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
  registry.register(createPreviewCommand());
  registry.register(createApplyCommand());
  registry.register(createRevertCommand());
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

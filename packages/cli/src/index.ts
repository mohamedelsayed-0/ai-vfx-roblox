import { CommandRegistry } from "./commands/registry.js";
import { createHelpCommand } from "./commands/help.js";
import { createExitCommand } from "./commands/exit.js";
import { startRepl } from "./repl/repl.js";
import { startWsServer, stopWsServer } from "./ui/ws-server.js";
import { launchUI, killUI } from "./ui/launch.js";

export async function main(): Promise<void> {
  const registry = new CommandRegistry();

  let rl: { close: () => void } | undefined;

  const cleanup = () => {
    rl?.close();
    killUI();
    stopWsServer();
  };

  // Register base commands
  registry.register(createHelpCommand(registry));
  registry.register(createExitCommand(cleanup));

  // Banner
  console.log();
  console.log("  VFX Copilot v0.1.0 — AI-powered VFX for Roblox Studio");
  console.log("  Type /help for available commands.");
  console.log();

  // Start WebSocket server for UI sync
  const wss = startWsServer(3001);
  wss.on("connection", (ws) => {
    // Send initial state to newly connected UI
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

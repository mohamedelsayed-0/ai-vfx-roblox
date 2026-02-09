import { CommandRegistry } from "./commands/registry.js";
import { createHelpCommand } from "./commands/help.js";
import { createExitCommand } from "./commands/exit.js";
import { startRepl } from "./repl/repl.js";

export async function main(): Promise<void> {
  const registry = new CommandRegistry();

  let rl: { close: () => void } | undefined;

  const cleanup = () => {
    rl?.close();
  };

  // Register base commands
  registry.register(createHelpCommand(registry));
  registry.register(createExitCommand(cleanup));

  // Banner
  console.log();
  console.log("  VFX Copilot v0.1.0 — AI-powered VFX for Roblox Studio");
  console.log('  Type /help for available commands.');
  console.log();

  // Start REPL
  rl = await startRepl(registry);
}

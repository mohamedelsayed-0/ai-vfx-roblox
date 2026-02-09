import type { SlashCommand } from "@vfxcopilot/shared";
import type { CommandRegistry } from "./registry.js";

export function createHelpCommand(registry: CommandRegistry): SlashCommand {
  return {
    name: "help",
    description: "Show available commands",
    usage: "/help",
    async handler() {
      const commands = registry.getAll();
      console.log("\n  Available Commands:");
      for (const cmd of commands) {
        const padded = `/${cmd.name}`.padEnd(18);
        console.log(`  ${padded} ${cmd.description}`);
      }
      console.log();
    },
  };
}

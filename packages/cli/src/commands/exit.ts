import type { SlashCommand } from "@vfxcopilot/shared";

export function createExitCommand(
  cleanup: () => void,
): SlashCommand {
  return {
    name: "exit",
    description: "Shut down VFX Copilot",
    usage: "/exit",
    async handler() {
      console.log("Shutting down VFX Copilot...");
      cleanup();
      process.exit(0);
    },
  };
}

import type { SlashCommand } from "@vfxcopilot/shared";
import { PRESETS, getPreset } from "@vfxcopilot/shared";
import { store } from "../state/store.js";
import { broadcast } from "../ui/ws-server.js";

export function createPresetsCommand(): SlashCommand {
  return {
    name: "presets",
    description: "List built-in effect presets",
    usage: "/presets [apply <name>]",
    async handler(args: string) {
      const parts = args.trim().split(/\s+/);

      if (parts[0] === "apply" && parts[1]) {
        const preset = getPreset(parts[1]);
        if (!preset) {
          console.log(`  Unknown preset: ${parts[1]}`);
          console.log("  Available: " + PRESETS.map((p) => p.name).join(", "));
          return;
        }

        store.update({ currentPatch: preset.patch, status: "idle" });
        console.log(`  Loaded preset: ${preset.name}`);
        console.log(`  ${preset.description}`);
        console.log(`  Operations: ${preset.patch.operations.length}`);
        console.log("  Use /preview to inspect, /apply to apply.\n");

        broadcast({
          type: "patchGenerated",
          patch: preset.patch,
          summary: preset.patch.summary,
          warnings: preset.patch.warnings,
        });
        return;
      }

      // List presets
      console.log("\n  Built-in Presets:");
      for (const p of PRESETS) {
        console.log(`    ${p.name.padEnd(22)} ${p.description}`);
      }
      console.log("\n  Apply a preset: /presets apply <name>\n");
    },
  };
}

import type { SlashCommand } from "@vfxcopilot/shared";
import { PatchSchema, validatePatch } from "@vfxcopilot/shared";
import { store } from "../state/store.js";
import { generate as callGenerate } from "../backend/client.js";
import { broadcast } from "../ui/ws-server.js";

export function createGenerateCommand(): SlashCommand {
  return {
    name: "generate",
    description: "Generate a VFX effect from description",
    usage: "/generate <prompt>",
    async handler(args: string) {
      if (!args.trim()) {
        console.log("Usage: /generate <prompt>");
        return;
      }

      store.update({ status: "generating", lastError: null });
      broadcast({ type: "status", status: "generating" });
      console.log(`\n  Generating: "${args.trim()}"...`);

      try {
        const result = await callGenerate(args.trim());
        const patch = PatchSchema.parse(result.patch);

        store.update({ status: "idle", currentPatch: patch, lastError: null });

        console.log(`  Generated: ${patch.summary}`);
        if (patch.warnings.length) {
          console.log(`  Warnings: ${patch.warnings.join(", ")}`);
        }
        console.log(`  Operations: ${patch.operations.length}`);

        const validation = validatePatch(patch);
        if (!validation.valid) {
          console.log("  SAFETY: BLOCKED — use /preview to see errors.");
        }
        console.log("  Use /preview to inspect, /apply to apply.\n");

        broadcast({
          type: "patchGenerated",
          patch,
          summary: patch.summary,
          warnings: patch.warnings,
        });
        broadcast({ type: "status", status: "idle" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        store.update({ status: "error", lastError: message });
        console.error(`  Error: ${message}\n`);
        broadcast({ type: "status", status: "error", message });
      }
    },
  };
}

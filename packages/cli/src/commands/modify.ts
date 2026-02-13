import type { SlashCommand, Patch } from "@vfxcopilot/shared";
import { PatchSchema, validatePatch } from "@vfxcopilot/shared";
import { store } from "../state/store.js";
import { modify as callModify } from "../backend/client.js";
import { broadcast } from "../ui/ws-server.js";

export function createModifyCommand(): SlashCommand {
  return {
    name: "modify",
    description: "Modify the current/last effect with a change prompt",
    usage: "/modify <what to change>",
    async handler(args: string) {
      if (!args.trim()) {
        console.log("Usage: /modify <what to change>");
        console.log('  Example: /modify "make the sparks bigger and add purple glow"');
        return;
      }

      const prompt = args.trim();

      // Find the base patch: current patch first, then last checkpoint
      const state = store.getState();
      const basePatch = state.currentPatch
        ?? state.checkpoints.at(-1)?.patch
        ?? null;

      if (!basePatch) {
        console.log("  No effect to modify.");
        console.log("  Run /generate first to create an effect, then use /modify to change it.");
        return;
      }

      store.update({ status: "generating", lastError: null });
      broadcast({ type: "status", status: "generating" });
      console.log(`\n  Modifying "${basePatch.effectName}": "${prompt}"...`);

      try {
        const result = await callModify(prompt, basePatch);
        const patch = PatchSchema.parse(result.patch);

        const validation = validatePatch(patch);

        if (!validation.valid) {
          store.update({ status: "idle", currentPatch: null, lastError: null });
          console.log(`  Modified: ${patch.summary}`);
          console.log(`  Operations: ${patch.operations.length}`);
          console.log("  REJECTED: Patch failed safety validation:");
          for (const e of validation.errors) {
            console.log(`    [BLOCKED] ${e}`);
          }
          console.log("  Cannot apply. Try a different modification.\n");
        } else {
          store.update({ status: "idle", currentPatch: patch, lastError: null });
          console.log(`  Modified: ${patch.summary}`);
          if (patch.warnings.length) {
            console.log(`  Warnings: ${patch.warnings.join(", ")}`);
          }
          console.log(`  Operations: ${patch.operations.length}`);
          console.log("  Use /preview to inspect, /apply to apply.\n");
        }

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

import type { SlashCommand, Patch } from "@vfxcopilot/shared";
import { PatchSchema, validatePatch, getAnimationOperations } from "@vfxcopilot/shared";
import { store } from "../state/store.js";
import { generate as callGenerate } from "../backend/client.js";
import { broadcast } from "../ui/ws-server.js";

export function createGenerateCommand(): SlashCommand {
  return {
    name: "generate",
    description: "Generate a VFX effect from description",
    usage: "/generate [--with-animations] <prompt>",
    async handler(args: string) {
      if (!args.trim()) {
        console.log("Usage: /generate <prompt>");
        return;
      }

      const withAnimations = args.includes("--with-animations");
      const prompt = args.replace("--with-animations", "").trim();

      if (!prompt) {
        console.log("Usage: /generate <prompt>");
        return;
      }

      store.update({ status: "generating", lastError: null });
      broadcast({ type: "status", status: "generating" });
      console.log(`\n  Generating: "${prompt}"...`);

      try {
        const result = await callGenerate(prompt);
        let patch = PatchSchema.parse(result.patch);

        // Append animation helpers if requested
        if (withAnimations) {
          const animOps = getAnimationOperations();
          patch = {
            ...patch,
            operations: [...patch.operations, ...animOps],
          } as Patch;
          console.log(`  + Added ${animOps.length} animation helper modules`);
        }

        // Validate BEFORE storing — blocked patches should not be accessible via /apply
        const validation = validatePatch(patch);

        if (!validation.valid) {
          store.update({ status: "idle", currentPatch: null, lastError: null });
          console.log(`  Generated: ${patch.summary}`);
          console.log(`  Operations: ${patch.operations.length}`);
          console.log("  REJECTED: Patch failed safety validation:");
          for (const e of validation.errors) {
            console.log(`    [BLOCKED] ${e}`);
          }
          console.log("  Cannot apply. Run /generate with a different prompt.\n");
        } else {
          store.update({ status: "idle", currentPatch: patch, lastError: null });
          console.log(`  Generated: ${patch.summary}`);
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

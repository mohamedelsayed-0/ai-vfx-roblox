import type { SlashCommand } from "@vfxcopilot/shared";
import { validatePatch } from "@vfxcopilot/shared";
import { store, type Checkpoint } from "../state/store.js";
import { broadcast } from "../ui/ws-server.js";
import { applyPatch } from "../backend/client.js";

let checkpointCounter = 0;

export function createApplyCommand(): SlashCommand {
  return {
    name: "apply",
    description: "Apply the current patch to Studio",
    usage: "/apply",
    async handler() {
      const { currentPatch } = store.getState();
      if (!currentPatch) {
        console.log("  No patch to apply. Run /generate first.");
        return;
      }

      // Safety validation gate
      const validation = validatePatch(currentPatch);
      if (!validation.valid) {
        console.log("  BLOCKED: Patch failed safety validation:");
        for (const e of validation.errors) {
          console.log(`    [BLOCKED] ${e}`);
        }
        console.log("  Cannot apply. Run /generate with a different prompt.\n");
        return;
      }

      // Create checkpoint
      checkpointCounter++;
      const checkpoint: Checkpoint = {
        id: `cp-${checkpointCounter}`,
        timestamp: Date.now(),
        effectName: currentPatch.effectName,
        patch: currentPatch,
        createdPaths: currentPatch.operations
          .filter((op) => op.op === "createInstance" || op.op === "createScript" || op.op === "ensureFolder")
          .map((op) => {
            if (op.op === "createInstance") return `${op.parentPath}/${op.name}`;
            if (op.op === "createScript") return op.path;
            if (op.op === "ensureFolder") return op.path;
            return "";
          }),
      };

      const checkpoints = [...store.getState().checkpoints, checkpoint];
      store.update({ checkpoints });

      // Push to backend for plugin polling
      try {
        await applyPatch(currentPatch, checkpoint.id, checkpoint.createdPaths);
        console.log(`  Applied: ${currentPatch.effectName}`);
        console.log(`  Checkpoint: ${checkpoint.id} (${currentPatch.operations.length} operations)`);
        console.log("  Sent to Studio plugin. Use /revert to undo.\n");
      } catch {
        console.log(`  Applied: ${currentPatch.effectName}`);
        console.log(`  Checkpoint: ${checkpoint.id} (${currentPatch.operations.length} operations)`);
        console.log("  WARNING: Failed to send to plugin — is the CLI backend running?");
        console.log("  The patch was saved locally. Retry /apply when the backend is up.\n");
      }

      broadcast({ type: "patchApplied", checkpointId: checkpoint.id });
    },
  };
}

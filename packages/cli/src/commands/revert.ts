import type { SlashCommand } from "@vfxcopilot/shared";
import { store } from "../state/store.js";
import { broadcast } from "../ui/ws-server.js";
import { revertPatch } from "../backend/client.js";

export function createRevertCommand(): SlashCommand {
  return {
    name: "revert",
    description: "Undo the last applied patch",
    usage: "/revert",
    async handler() {
      const { checkpoints } = store.getState();
      if (checkpoints.length === 0) {
        console.log("  No checkpoints to revert.");
        return;
      }

      const cp = checkpoints[checkpoints.length - 1]!;
      const remaining = checkpoints.slice(0, -1);
      store.update({ checkpoints: remaining, currentPatch: null });

      // Push to backend for plugin polling
      await revertPatch(cp.createdPaths);

      console.log(`  Reverted: ${cp.effectName} (${cp.id})`);
      console.log(`  Removed ${cp.createdPaths.length} paths. Sent to Studio plugin.`);
      if (remaining.length > 0) {
        console.log(`  ${remaining.length} checkpoint(s) remaining.`);
      }
      console.log();

      broadcast({ type: "patchReverted", checkpointId: cp.id });
    },
  };
}

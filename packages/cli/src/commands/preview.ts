import type { SlashCommand, Operation } from "@vfxcopilot/shared";
import { validatePatch } from "@vfxcopilot/shared";
import { store } from "../state/store.js";

function formatOp(op: Operation): string {
  switch (op.op) {
    case "ensureFolder":
      return `ensureFolder  ${op.path}`;
    case "createInstance":
      return `create        ${op.className} "${op.name}" -> ${op.parentPath}`;
    case "createScript":
      return `createScript  ${op.scriptType} -> ${op.path}`;
    case "setProperty":
      return `setProperty   ${op.targetPath}.${op.property}`;
    case "deleteInstance":
      return `delete        ${op.path}`;
    case "moveInstance":
      return `move          ${op.fromPath} -> ${op.toPath}`;
  }
}

export function createPreviewCommand(): SlashCommand {
  return {
    name: "preview",
    description: "Preview the last generated patch",
    usage: "/preview",
    async handler() {
      const { currentPatch } = store.getState();
      if (!currentPatch) {
        console.log("  No patch to preview. Run /generate first.");
        return;
      }

      const validation = validatePatch(currentPatch);

      console.log();
      console.log(`  --- Patch Preview: ${currentPatch.effectName} ---`);
      console.log(`  Summary: ${currentPatch.summary}`);
      console.log(`  Operations (${currentPatch.operations.length}):`);
      for (const op of currentPatch.operations) {
        console.log(`    ${formatOp(op)}`);
      }
      if (currentPatch.warnings.length) {
        console.log(`  Warnings:`);
        for (const w of currentPatch.warnings) {
          console.log(`    - ${w}`);
        }
      }
      if (!validation.valid) {
        console.log(`  SAFETY ERRORS (patch will be blocked):`);
        for (const e of validation.errors) {
          console.log(`    [BLOCKED] ${e}`);
        }
      } else {
        console.log("  Safety: PASSED");
      }
      console.log("  ---");
      console.log();
    },
  };
}

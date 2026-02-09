import type { Patch, Operation } from "../schemas/patch.js";
import { ALLOWED_ROOTS, MAX_PATH_DEPTH, MAX_OPERATIONS, BLOCKED_LUA_PATTERNS } from "../constants.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function extractPaths(op: Operation): string[] {
  switch (op.op) {
    case "ensureFolder":
      return [op.path];
    case "createInstance":
      return [op.parentPath];
    case "createScript":
      return [op.path];
    case "setProperty":
      return [op.targetPath];
    case "deleteInstance":
      return [op.path];
    case "moveInstance":
      return [op.fromPath, op.toPath];
  }
}

export function validatePatch(patch: Patch): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Max operations
  if (patch.operations.length > MAX_OPERATIONS) {
    errors.push(`Too many operations: ${patch.operations.length} (max ${MAX_OPERATIONS})`);
  }

  // Path restrictions
  for (const op of patch.operations) {
    for (const p of extractPaths(op)) {
      if (!ALLOWED_ROOTS.some((root) => p.startsWith(root))) {
        errors.push(`Path outside allowed roots: ${p}`);
      }
      if (p.includes("..")) {
        errors.push(`Directory traversal detected: ${p}`);
      }
      if (p.split("/").length > MAX_PATH_DEPTH) {
        errors.push(`Path too deep: ${p} (max ${MAX_PATH_DEPTH} levels)`);
      }
    }
  }

  // Blocked Lua patterns in scripts
  for (const op of patch.operations) {
    if (op.op === "createScript") {
      for (const pattern of BLOCKED_LUA_PATTERNS) {
        if (op.source.includes(pattern)) {
          errors.push(`Blocked Lua pattern in script at ${op.path}: "${pattern}"`);
        }
      }
    }
  }

  // $ref validation: targets must exist in prior operations
  const definedIds = new Set<string>();
  for (const op of patch.operations) {
    if (op.op === "createInstance") {
      definedIds.add(op.id);
      for (const [key, value] of Object.entries(op.properties)) {
        if (typeof value === "object" && value !== null && "$ref" in value) {
          const ref = (value as { $ref: string }).$ref;
          if (!definedIds.has(ref)) {
            errors.push(`$ref "${ref}" in ${op.name}.${key} references undefined id`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

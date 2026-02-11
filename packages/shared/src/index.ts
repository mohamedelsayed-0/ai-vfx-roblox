export type { SlashCommand } from "./types/commands.js";
export type { ServerMessage, ClientMessage } from "./types/ws-messages.js";
export { PatchSchema, OperationSchema } from "./schemas/patch.js";
export type { Patch, Operation } from "./schemas/patch.js";
export {
  Color3Schema,
  Vector3Schema,
  Vector2Schema,
  RefSchema,
  EnumSchema,
  ColorSequenceSchema,
  NumberSequenceSchema,
  NumberRangeSchema,
  PropertyValueSchema,
} from "./schemas/properties.js";
export {
  ALLOWED_ROOTS,
  MAX_PATH_DEPTH,
  MAX_OPERATIONS,
  BLOCKED_LUA_PATTERNS,
  ALLOWED_LIGHTING_CLASSES,
} from "./constants.js";
export { validatePatch } from "./validation/safety.js";
export type { ValidationResult } from "./validation/safety.js";
export { PRESETS, getPreset } from "./presets/index.js";
export type { PresetInfo } from "./presets/index.js";
export { ANIMATION_HELPERS, getAnimationOperations } from "./presets/animations/index.js";
export type { AnimationHelper } from "./presets/animations/index.js";

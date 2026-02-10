import type { Patch } from "../../schemas/patch.js";
import { TWEEN_RIG_SOURCE } from "./tween-rig.js";
import { CAMERA_SHAKE_SOURCE } from "./camera-shake.js";
import { DASH_MOTION_SOURCE } from "./dash-motion.js";
import { RECOIL_SOURCE } from "./recoil.js";
import { IMPACT_SOURCE } from "./impact.js";

export interface AnimationHelper {
  name: string;
  description: string;
  scriptName: string;
  source: string;
}

export const ANIMATION_HELPERS: AnimationHelper[] = [
  {
    name: "tween-rig",
    description: "General-purpose tween utilities (tween, tweenSequence, pulse)",
    scriptName: "TweenRig",
    source: TWEEN_RIG_SOURCE,
  },
  {
    name: "camera-shake",
    description: "Camera shake effects (shake, impact, rumble)",
    scriptName: "CameraShake",
    source: CAMERA_SHAKE_SOURCE,
  },
  {
    name: "dash-motion",
    description: "Dash/lunge movement helpers (dash, forwardDash)",
    scriptName: "DashMotion",
    source: DASH_MOTION_SOURCE,
  },
  {
    name: "recoil",
    description: "Recoil animations (gunRecoil, punchRecoil)",
    scriptName: "Recoil",
    source: RECOIL_SOURCE,
  },
  {
    name: "impact",
    description: "Impact effects (hitStop, knockback, screenFlash)",
    scriptName: "Impact",
    source: IMPACT_SOURCE,
  },
];

export function getAnimationOperations(): Patch["operations"] {
  return [
    {
      op: "ensureFolder" as const,
      path: "ReplicatedStorage/VFXCopilot/AnimationHelpers",
    },
    ...ANIMATION_HELPERS.map((helper) => ({
      op: "createScript" as const,
      scriptType: "ModuleScript" as const,
      path: `ReplicatedStorage/VFXCopilot/AnimationHelpers/${helper.scriptName}`,
      source: helper.source,
    })),
  ];
}

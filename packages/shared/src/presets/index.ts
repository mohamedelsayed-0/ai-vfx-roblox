import type { Patch } from "../schemas/patch.js";
import { neonDashTrail } from "./neon-dash-trail.js";
import { fireballImpact } from "./fireball-impact.js";
import { dustLandingPuff } from "./dust-landing-puff.js";

export interface PresetInfo {
  name: string;
  description: string;
  patch: Patch;
}

export const PRESETS: PresetInfo[] = [
  {
    name: "neon-dash-trail",
    description: "Neon dash trail with glowing beam and speed particles",
    patch: neonDashTrail,
  },
  {
    name: "fireball-impact",
    description: "Fireball explosion with fire burst, smoke, and flash",
    patch: fireballImpact,
  },
  {
    name: "dust-landing-puff",
    description: "Soft dust puff on landing with radial spread",
    patch: dustLandingPuff,
  },
];

export function getPreset(name: string): PresetInfo | undefined {
  return PRESETS.find((p) => p.name === name);
}

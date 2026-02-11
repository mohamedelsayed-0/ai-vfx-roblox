import type { Patch } from "../schemas/patch.js";

export const fireballImpact: Patch = {
  version: "1.0",
  effectName: "FireballImpact",
  rootFolder: "ReplicatedStorage/VFXCopilot/Effects",
  summary: "Fireball explosion with fire burst, smoke, and shockwave ring",
  warnings: [],
  operations: [
    {
      op: "ensureFolder",
      path: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
    },
    {
      op: "createInstance",
      id: "fire",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "FireBurst",
      properties: {
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.3 },
            { time: 1, value: 0.6 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 20 },
            { time: 1, value: 5 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 1 },
            { time: 0.5, value: 3 },
            { time: 1, value: 0 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 1, g: 0.9, b: 0.3 } },
            { time: 0.5, color: { r: 1, g: 0.4, b: 0 } },
            { time: 1, color: { r: 0.3, g: 0, b: 0 } },
          ],
        },
        LightEmission: 1,
        SpreadAngle: { $type: "Vector3", x: 180, y: 180, z: 0 },
      },
    },
    {
      op: "createInstance",
      id: "smoke",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "ImpactSmoke",
      properties: {
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 1 },
            { time: 1, value: 2 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 8 },
            { time: 1, value: 2 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 2 },
            { time: 1, value: 6 },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.3 },
            { time: 1, value: 1 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0.3, g: 0.3, b: 0.3 } },
            { time: 1, color: { r: 0.1, g: 0.1, b: 0.1 } },
          ],
        },
        SpreadAngle: { $type: "Vector3", x: 180, y: 180, z: 0 },
      },
    },
    {
      op: "createInstance",
      id: "impactLight",
      className: "PointLight",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "ImpactFlash",
      properties: {
        Color: { $type: "Color3", r: 1, g: 0.6, b: 0 },
        Brightness: 5,
        Range: 20,
      },
    },
    {
      op: "createInstance",
      id: "sfx",
      className: "Sound",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "ExplosionSound",
      properties: {
        Volume: 0.8,
        PlaybackSpeed: 1,
      },
    },
    {
      op: "createScript",
      scriptType: "ModuleScript",
      path: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact/EffectController",
      source:
        'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\t-- Emit burst particles\n\tlocal fire = effect:FindFirstChild("FireBurst")\n\tlocal smoke = effect:FindFirstChild("ImpactSmoke")\n\tif fire then fire:Emit(30) end\n\tif smoke then smoke:Emit(15) end\n\t-- Play sound\n\tlocal sfx = effect:FindFirstChild("ExplosionSound")\n\tif sfx then sfx:Play() end\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
    },
  ],
};

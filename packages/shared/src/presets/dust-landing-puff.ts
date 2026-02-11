import type { Patch } from "../schemas/patch.js";

export const dustLandingPuff: Patch = {
  version: "1.0",
  effectName: "DustLandingPuff",
  rootFolder: "ReplicatedStorage/VFXCopilot/Effects",
  summary: "Soft dust puff on landing with radial spread and fade",
  warnings: [],
  operations: [
    {
      op: "ensureFolder",
      path: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff",
    },
    {
      op: "createInstance",
      id: "dust",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff",
      name: "DustCloud",
      properties: {
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.5 },
            { time: 1, value: 1 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 3 },
            { time: 1, value: 1 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.5 },
            { time: 0.5, value: 2 },
            { time: 1, value: 3 },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.2 },
            { time: 0.5, value: 0.5 },
            { time: 1, value: 1 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0.7, g: 0.65, b: 0.55 } },
            { time: 1, color: { r: 0.5, g: 0.45, b: 0.35 } },
          ],
        },
        SpreadAngle: { $type: "Vector2", x: 60, y: 10 },
        RotSpeed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: -30 },
            { time: 1, value: 30 },
          ],
        },
      },
    },
    {
      op: "createInstance",
      id: "pebbles",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff",
      name: "Pebbles",
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
            { time: 0, value: 8 },
            { time: 1, value: 3 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.1 },
            { time: 1, value: 0.05 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0.5, g: 0.45, b: 0.35 } },
            { time: 1, color: { r: 0.4, g: 0.35, b: 0.25 } },
          ],
        },
        SpreadAngle: { $type: "Vector2", x: 45, y: 20 },
      },
    },
    {
      op: "createScript",
      scriptType: "ModuleScript",
      path: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff/EffectController",
      source:
        'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\tlocal dust = effect:FindFirstChild("DustCloud")\n\tlocal pebbles = effect:FindFirstChild("Pebbles")\n\tif dust then dust:Emit(20) end\n\tif pebbles then pebbles:Emit(10) end\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
    },
  ],
};

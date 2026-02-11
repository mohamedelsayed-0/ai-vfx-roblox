import type { Patch } from "../schemas/patch.js";

export const neonDashTrail: Patch = {
  version: "1.0",
  effectName: "NeonDashTrail",
  rootFolder: "ReplicatedStorage/VFXCopilot/Effects",
  summary: "Neon dash trail with glowing beam and speed particles",
  warnings: ["Attach to character HumanoidRootPart for best results."],
  operations: [
    {
      op: "ensureFolder",
      path: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
    },
    {
      op: "createInstance",
      id: "att0",
      className: "Attachment",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
      name: "TrailStart",
      properties: {
        Position: { $type: "Vector3", x: 0, y: 0, z: -1 },
      },
    },
    {
      op: "createInstance",
      id: "att1",
      className: "Attachment",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
      name: "TrailEnd",
      properties: {
        Position: { $type: "Vector3", x: 0, y: 0, z: 1 },
      },
    },
    {
      op: "createInstance",
      id: "trail",
      className: "Trail",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
      name: "NeonTrail",
      properties: {
        Attachment0: { $ref: "att0" },
        Attachment1: { $ref: "att1" },
        Lifetime: 0.3,
        MinLength: 0.05,
        LightEmission: 1,
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0, g: 0.8, b: 1 } },
            { time: 1, color: { r: 0.5, g: 0, b: 1 } },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0 },
            { time: 0.8, value: 0.3 },
            { time: 1, value: 1 },
          ],
        },
        WidthScale: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 1 },
            { time: 1, value: 0.2 },
          ],
        },
      },
    },
    {
      op: "createInstance",
      id: "sparks",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
      name: "SpeedSparks",
      properties: {
        Enabled: true,
        Rate: 80,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.1 },
            { time: 1, value: 0.3 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 5 },
            { time: 1, value: 15 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.1 },
            { time: 1, value: 0 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0, g: 1, b: 1 } },
            { time: 1, color: { r: 0.3, g: 0.3, b: 1 } },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0 },
            { time: 1, value: 1 },
          ],
        },
        LightEmission: 1,
        SpreadAngle: { $type: "Vector3", x: 30, y: 30, z: 0 },
      },
    },
    {
      op: "createInstance",
      id: "glow",
      className: "PointLight",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail",
      name: "DashGlow",
      properties: {
        Color: { $type: "Color3", r: 0, g: 0.7, b: 1 },
        Brightness: 2,
        Range: 12,
      },
    },
    {
      op: "createScript",
      scriptType: "ModuleScript",
      path: "ReplicatedStorage/VFXCopilot/Effects/NeonDashTrail/EffectController",
      source:
        'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
    },
  ],
};

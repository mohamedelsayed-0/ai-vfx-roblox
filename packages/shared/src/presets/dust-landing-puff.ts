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
        Texture: "rbxasset://textures/particles/smoke_main.dds",
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.6 },
            { time: 1, value: 1.2 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 4 },
            { time: 1, value: 1 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.5 },
            { time: 0.5, value: 2.5 },
            { time: 1, value: 4 },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.2 },
            { time: 0.4, value: 0.5 },
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
        LightEmission: 0,
        SpreadAngle: { $type: "Vector2", x: 60, y: 10 },
        Drag: 3,
        RotSpeed: { $type: "NumberRange", min: -90, max: 90 },
        Rotation: { $type: "NumberRange", min: 0, max: 360 },
        Acceleration: { $type: "Vector3", x: 0, y: 1, z: 0 },
      },
    },
    {
      op: "createInstance",
      id: "pebbles",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff",
      name: "Pebbles",
      properties: {
        Texture: "rbxasset://textures/particles/sparkles_main.dds",
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.4 },
            { time: 1, value: 0.8 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 10 },
            { time: 1, value: 4 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.12 },
            { time: 1, value: 0.05 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0.55, g: 0.5, b: 0.4 } },
            { time: 1, color: { r: 0.4, g: 0.35, b: 0.25 } },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0 },
            { time: 1, value: 1 },
          ],
        },
        LightEmission: 0,
        SpreadAngle: { $type: "Vector2", x: 50, y: 20 },
        Drag: 2,
        Acceleration: { $type: "Vector3", x: 0, y: -15, z: 0 },
        Orientation: { $enum: "Enum.ParticleOrientation.VelocityPerpendicular" },
      },
    },
    {
      op: "createScript",
      scriptType: "ModuleScript",
      path: "ReplicatedStorage/VFXCopilot/Effects/DustLandingPuff/EffectController",
      source:
        'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\tfor _, child in ipairs(effect:GetChildren()) do\n\t\tif child:IsA("ParticleEmitter") and child.Rate == 0 then\n\t\t\tchild:Emit(20)\n\t\tend\n\tend\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
    },
  ],
};

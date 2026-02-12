import type { Patch } from "../schemas/patch.js";

export const fireballImpact: Patch = {
  version: "1.0",
  effectName: "FireballImpact",
  rootFolder: "ReplicatedStorage/VFXCopilot/Effects",
  summary: "Fireball explosion with fire burst, smoke, debris, and shockwave",
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
        Texture: "rbxasset://textures/particles/fire_main.dds",
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.3 },
            { time: 1, value: 0.7 },
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
            { time: 0, value: 1.5 },
            { time: 0.3, value: 3.5 },
            { time: 1, value: 0 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 1, g: 0.95, b: 0.4 } },
            { time: 0.3, color: { r: 1, g: 0.5, b: 0 } },
            { time: 1, color: { r: 0.3, g: 0, b: 0 } },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0 },
            { time: 0.6, value: 0.4 },
            { time: 1, value: 1 },
          ],
        },
        LightEmission: 1,
        SpreadAngle: { $type: "Vector2", x: 180, y: 180 },
        Drag: 3,
        Orientation: { $enum: "Enum.ParticleOrientation.VelocityParallel" },
      },
    },
    {
      op: "createInstance",
      id: "smoke",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "ImpactSmoke",
      properties: {
        Texture: "rbxasset://textures/particles/smoke_main.dds",
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 1.5 },
            { time: 1, value: 3 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 6 },
            { time: 1, value: 1 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 1 },
            { time: 0.5, value: 4 },
            { time: 1, value: 6 },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.3 },
            { time: 0.5, value: 0.6 },
            { time: 1, value: 1 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 0.4, g: 0.35, b: 0.3 } },
            { time: 1, color: { r: 0.12, g: 0.12, b: 0.12 } },
          ],
        },
        LightEmission: 0,
        SpreadAngle: { $type: "Vector2", x: 180, y: 180 },
        Drag: 5,
        RotSpeed: { $type: "NumberRange", min: -60, max: 60 },
        Rotation: { $type: "NumberRange", min: 0, max: 360 },
        Acceleration: { $type: "Vector3", x: 0, y: 2, z: 0 },
      },
    },
    {
      op: "createInstance",
      id: "debris",
      className: "ParticleEmitter",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "Debris",
      properties: {
        Texture: "rbxasset://textures/particles/sparkles_main.dds",
        Enabled: true,
        Rate: 0,
        Lifetime: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.5 },
            { time: 1, value: 1.2 },
          ],
        },
        Speed: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 15 },
            { time: 1, value: 8 },
          ],
        },
        Size: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0.2 },
            { time: 1, value: 0 },
          ],
        },
        Color: {
          $type: "ColorSequence",
          keypoints: [
            { time: 0, color: { r: 1, g: 0.8, b: 0.3 } },
            { time: 1, color: { r: 0.5, g: 0.2, b: 0 } },
          ],
        },
        Transparency: {
          $type: "NumberSequence",
          keypoints: [
            { time: 0, value: 0 },
            { time: 1, value: 1 },
          ],
        },
        LightEmission: 0.8,
        SpreadAngle: { $type: "Vector2", x: 180, y: 180 },
        Drag: 2,
        Acceleration: { $type: "Vector3", x: 0, y: -20, z: 0 },
        Orientation: { $enum: "Enum.ParticleOrientation.VelocityPerpendicular" },
      },
    },
    {
      op: "createInstance",
      id: "impactLight",
      className: "PointLight",
      parentPath: "ReplicatedStorage/VFXCopilot/Effects/FireballImpact",
      name: "ImpactFlash",
      properties: {
        Color: { $type: "Color3", r: 1, g: 0.7, b: 0.2 },
        Brightness: 10,
        Range: 25,
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
        'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\tfor _, child in ipairs(effect:GetChildren()) do\n\t\tif child:IsA("ParticleEmitter") and child.Rate == 0 then\n\t\t\tchild:Emit(25)\n\t\tend\n\tend\n\tlocal sfx = effect:FindFirstChild("ExplosionSound")\n\tif sfx then sfx:Play() end\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
    },
  ],
};

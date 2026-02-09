import type { Patch } from "@vfxcopilot/shared";

export function getStubPatch(): Patch {
  return {
    version: "1.0",
    effectName: "SwordSlashTrail",
    rootFolder: "ReplicatedStorage/VFXCopilot/Effects",
    summary: "Sword slash with trail + impact sparks",
    warnings: [],
    operations: [
      {
        op: "ensureFolder",
        path: "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
      },
      {
        op: "createInstance",
        id: "attachment0",
        className: "Attachment",
        parentPath: "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
        name: "Attachment0",
        properties: {
          Position: { $type: "Vector3", x: 0, y: 0, z: -1 },
        },
      },
      {
        op: "createInstance",
        id: "attachment1",
        className: "Attachment",
        parentPath: "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
        name: "Attachment1",
        properties: {
          Position: { $type: "Vector3", x: 0, y: 0, z: 1 },
        },
      },
      {
        op: "createInstance",
        id: "trail",
        className: "Trail",
        parentPath: "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail",
        name: "SlashTrail",
        properties: {
          Attachment0: { $ref: "attachment0" },
          Attachment1: { $ref: "attachment1" },
          Color: {
            $type: "ColorSequence",
            keypoints: [
              { time: 0, color: { r: 1, g: 1, b: 1 } },
              { time: 1, color: { r: 0.5, g: 0.5, b: 1 } },
            ],
          },
          Lifetime: 0.3,
          Transparency: {
            $type: "NumberSequence",
            keypoints: [
              { time: 0, value: 0 },
              { time: 1, value: 1 },
            ],
          },
        },
      },
      {
        op: "createScript",
        scriptType: "ModuleScript",
        path: "ReplicatedStorage/VFXCopilot/Effects/SwordSlashTrail/EffectController",
        source:
          'local module = {}\n\nfunction module.Create(parent)\n\tlocal effect = script.Parent:Clone()\n\teffect.Parent = parent\n\treturn effect\nend\n\nfunction module.Destroy(effect)\n\teffect:Destroy()\nend\n\nreturn module',
      },
    ],
  };
}

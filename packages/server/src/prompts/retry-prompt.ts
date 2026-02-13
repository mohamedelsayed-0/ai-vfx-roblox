export const RETRY_PROMPT = `Your last response was invalid JSON. Please output ONLY the JSON patch object with no markdown fences, no commentary, no backticks. The response must be parseable by JSON.parse().

Required structure:
{
  "version": "1.0",
  "effectName": "PascalCaseName",
  "rootFolder": "ReplicatedStorage/VFXCopilot/Effects",
  "summary": "one line description",
  "warnings": [],
  "operations": [
    { "op": "ensureFolder", "path": "ReplicatedStorage/VFXCopilot/Effects/PascalCaseName" },
    { "op": "createInstance", "id": "uniqueId", "className": "ParticleEmitter", "parentPath": "ReplicatedStorage/VFXCopilot/Effects/PascalCaseName", "name": "DisplayName", "properties": { ... } },
    { "op": "createScript", "scriptType": "ModuleScript", "path": "ReplicatedStorage/VFXCopilot/Effects/PascalCaseName/EffectController", "source": "..." }
  ]
}

Rules:
- Start with { and end with }
- "version" must be "1.0"
- "operations" must be a non-empty array
- All paths must start with "ReplicatedStorage/VFXCopilot/" or "Workspace/VFXCopilot/"
- Every $ref must match an "id" from a prior createInstance operation
- Include an EffectController ModuleScript with Create() and Destroy()
- Property types: Color3 = {"$type":"Color3","r":N,"g":N,"b":N}, NumberSequence = {"$type":"NumberSequence","keypoints":[{"time":N,"value":N}]}

Output ONLY valid JSON:`;

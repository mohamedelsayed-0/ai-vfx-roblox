export const RETRY_PROMPT = `Your last response was invalid JSON. Please output ONLY the JSON patch object with no markdown fences, no commentary, no backticks. The response must be parseable by JSON.parse().

Remember:
- Start with { and end with }
- "version" must be "1.0"
- "operations" must be a non-empty array
- All paths must start with "ReplicatedStorage/VFXCopilot/" or "Workspace/VFXCopilot/"
- Include an EffectController ModuleScript

Output ONLY valid JSON:`;

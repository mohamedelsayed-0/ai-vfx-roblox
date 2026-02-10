export type ServerMessage =
  | { type: "status"; status: "idle" | "generating" | "error"; message?: string }
  | { type: "commandList"; commands: { name: string; description: string; usage: string }[] }
  | { type: "commandOutput"; command: string; output: string }
  | { type: "patchGenerated"; patch: unknown; summary: string; warnings: string[] }
  | { type: "patchApplied"; checkpointId: string }
  | { type: "patchReverted"; checkpointId: string }
  | { type: "commandError"; message: string };

export type ClientMessage =
  | { type: "command"; command: string }
  | { type: "ping" };

const BACKEND_URL = "http://127.0.0.1:3000";

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface GenerateResponse {
  patch: unknown;
  summary: string;
  warnings: string[];
  estimatedObjects: number;
}

export async function generate(
  prompt: string,
  context: { selectedObjects?: string[]; existingEffects?: string[] } = {},
): Promise<GenerateResponse> {
  const res = await fetch(`${BACKEND_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, context }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail = (errorData as any).error || res.statusText;
    throw new Error(`Backend error: ${res.status} ${detail}`);
  }
  return res.json() as Promise<GenerateResponse>;
}

export async function applyPatch(
  patch: unknown,
  checkpointId: string,
  createdPaths: string[],
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patch, checkpointId, createdPaths }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }
}

export async function revertPatch(paths: string[]): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/revert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }
}

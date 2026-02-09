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
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<GenerateResponse>;
}

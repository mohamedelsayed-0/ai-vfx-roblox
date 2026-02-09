import type { FastifyInstance } from "fastify";
import { PatchSchema } from "@vfxcopilot/shared";
import { getStubPatch } from "../services/stub.js";

interface GenerateBody {
  prompt: string;
  context?: {
    selectedObjects?: string[];
    existingEffects?: string[];
  };
}

export async function generateRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: GenerateBody }>("/generate", async (request) => {
    const { prompt } = request.body;
    app.log.info({ prompt }, "Generate request received");

    // Phase 3: return stub; Phase 8 will swap in Gemini
    const patch = getStubPatch();
    const validated = PatchSchema.parse(patch);

    return {
      patch: validated,
      summary: validated.summary,
      warnings: validated.warnings,
      estimatedObjects: validated.operations.length,
    };
  });
}

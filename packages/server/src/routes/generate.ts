import type { FastifyInstance } from "fastify";
import { PatchSchema, type Patch } from "@vfxcopilot/shared";
import { getStubPatch } from "../services/stub.js";

interface GenerateBody {
  prompt: string;
  context?: {
    selectedObjects?: string[];
    existingEffects?: string[];
  };
}

// Store latest patch for plugin polling
let latestPatch: { patch: Patch; summary: string; warnings: string[] } | null = null;

export async function generateRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Body: GenerateBody }>("/generate", async (request) => {
    const { prompt } = request.body;
    app.log.info({ prompt }, "Generate request received");

    // Phase 3: return stub; Phase 8 will swap in Gemini
    const patch = getStubPatch();
    const validated = PatchSchema.parse(patch);

    latestPatch = {
      patch: validated,
      summary: validated.summary,
      warnings: validated.warnings,
    };

    return {
      patch: validated,
      summary: validated.summary,
      warnings: validated.warnings,
      estimatedObjects: validated.operations.length,
    };
  });

  app.get("/latest-patch", async () => {
    if (!latestPatch) {
      return { patch: null };
    }
    return latestPatch;
  });
}

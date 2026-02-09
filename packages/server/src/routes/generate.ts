import type { FastifyInstance } from "fastify";
import { PatchSchema, type Patch } from "@vfxcopilot/shared";
import { getStubPatch } from "../services/stub.js";
import { generateWithGemini } from "../services/gemini.js";

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
  app.post<{ Body: GenerateBody }>("/generate", async (request, reply) => {
    const { prompt, context } = request.body;
    app.log.info({ prompt }, "Generate request received");

    const apiKey = process.env["GEMINI_API_KEY"];
    let patch: Patch;

    if (apiKey) {
      // Real Gemini generation
      try {
        patch = await generateWithGemini(prompt, context || {}, apiKey);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        app.log.error({ err: message }, "Gemini generation failed");
        reply.code(500);
        return { error: message };
      }
    } else {
      // Fallback to stub when no API key
      app.log.warn("No GEMINI_API_KEY set — returning stub patch");
      patch = PatchSchema.parse(getStubPatch());
    }

    latestPatch = {
      patch,
      summary: patch.summary,
      warnings: patch.warnings,
    };

    return {
      patch,
      summary: patch.summary,
      warnings: patch.warnings,
      estimatedObjects: patch.operations.length,
    };
  });

  app.get("/latest-patch", async () => {
    if (!latestPatch) {
      return { patch: null };
    }
    return latestPatch;
  });
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PatchSchema, type Patch } from "@vfxcopilot/shared";
import { SYSTEM_PROMPT } from "../prompts/system-prompt.js";
import { RETRY_PROMPT } from "../prompts/retry-prompt.js";
import { MODIFY_PROMPT } from "../prompts/modify-prompt.js";

export interface GenerateContext {
  selectedObjects?: string[];
  existingEffects?: string[];
}

export async function generateWithGemini(
  prompt: string,
  context: GenerateContext,
  apiKey: string,
): Promise<Patch> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const contextInfo = context.existingEffects?.length
    ? `\nExisting effects in project: ${context.existingEffects.join(", ")}`
    : "";

  const userPrompt = `${SYSTEM_PROMPT}\n\n${contextInfo}\n\nUser request: ${prompt}`;

  const cleanJson = (text: string) => {
    return text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  };

  const attemptParse = (text: string) => {
    const cleaned = cleanJson(text);
    try {
      const parsed = JSON.parse(cleaned);
      return PatchSchema.parse(parsed);
    } catch (err) {
      console.error("[Gemini] Parse Error:", err instanceof Error ? err.message : String(err));
      console.error("[Gemini] Raw Text Sample:", cleaned.slice(0, 100));
      throw err;
    }
  };

  // First attempt
  console.log(`[Gemini] Generating with prompt length: ${userPrompt.length}`);
  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  console.log(`[Gemini] Received response length: ${text.length}`);

  try {
    return attemptParse(text);
  } catch (firstError) {
    console.warn("[Gemini] First attempt failed, retrying...");
    // Retry once with correction prompt
    const retryPrompt = `${RETRY_PROMPT}\n\nOriginal request: ${prompt}\n\nError: ${firstError instanceof Error ? firstError.message : String(firstError)}`;
    const retryResult = await model.generateContent(retryPrompt);
    const retryText = retryResult.response.text();

    try {
      return attemptParse(retryText);
    } catch (secondError) {
      const msg = secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`AI returned invalid format after retry: ${msg}`);
    }
  }
}

export async function modifyWithGemini(
  modifyRequest: string,
  existingPatch: Patch,
  apiKey: string,
): Promise<Patch> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const userPrompt = `${MODIFY_PROMPT}\n\n## Current Effect Patch\n\n${JSON.stringify(existingPatch, null, 2)}\n\n## User Modification Request\n\n${modifyRequest}`;

  const cleanJson = (text: string) => {
    return text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  };

  const attemptParse = (text: string) => {
    const cleaned = cleanJson(text);
    try {
      const parsed = JSON.parse(cleaned);
      return PatchSchema.parse(parsed);
    } catch (err) {
      console.error("[Gemini Modify] Parse Error:", err instanceof Error ? err.message : String(err));
      console.error("[Gemini Modify] Raw Text Sample:", cleaned.slice(0, 100));
      throw err;
    }
  };

  console.log(`[Gemini Modify] Modifying "${existingPatch.effectName}" with prompt length: ${userPrompt.length}`);
  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  console.log(`[Gemini Modify] Received response length: ${text.length}`);

  try {
    return attemptParse(text);
  } catch (firstError) {
    console.warn("[Gemini Modify] First attempt failed, retrying...");
    const retryPrompt = `${RETRY_PROMPT}\n\nOriginal modification request: ${modifyRequest}\n\nEffect being modified: ${existingPatch.effectName}\n\nError: ${firstError instanceof Error ? firstError.message : String(firstError)}`;
    const retryResult = await model.generateContent(retryPrompt);
    const retryText = retryResult.response.text();

    try {
      return attemptParse(retryText);
    } catch (secondError) {
      const msg = secondError instanceof Error ? secondError.message : String(secondError);
      throw new Error(`AI returned invalid format after retry: ${msg}`);
    }
  }
}

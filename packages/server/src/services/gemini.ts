import { GoogleGenerativeAI } from "@google/generative-ai";
import { PatchSchema, type Patch } from "@vfxcopilot/shared";
import { SYSTEM_PROMPT } from "../prompts/system-prompt.js";
import { RETRY_PROMPT } from "../prompts/retry-prompt.js";

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
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const contextInfo = context.existingEffects?.length
    ? `\nExisting effects in project: ${context.existingEffects.join(", ")}`
    : "";

  const userPrompt = `${SYSTEM_PROMPT}\n\n${contextInfo}\n\nUser request: ${prompt}`;

  // First attempt
  console.log(`[Gemini] Generating with prompt length: ${userPrompt.length}`);
  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  console.log(`[Gemini] Received response length: ${text.length}`);

  try {
    const parsed = JSON.parse(text);
    return PatchSchema.parse(parsed);
  } catch (firstError) {
    // Retry once with correction prompt
    const retryPrompt = `${RETRY_PROMPT}\n\nOriginal request: ${prompt}`;
    const retryResult = await model.generateContent(retryPrompt);
    const retryText = retryResult.response.text();

    try {
      const retryParsed = JSON.parse(retryText);
      return PatchSchema.parse(retryParsed);
    } catch (secondError) {
      throw new Error(
        "AI returned invalid format after retry. Try rephrasing your prompt or use a preset.",
      );
    }
  }
}

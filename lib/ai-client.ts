import Groq from "groq-sdk";

export const AI_PROVIDER = process.env.AI_PROVIDER ?? "groq";
export const AI_MODEL = process.env.AI_MODEL ?? "llama3-70b-8192";

export function isAIConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export function getAIClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return new Groq({ apiKey });
}

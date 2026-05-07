import type { LLMProvider } from "./types";
import { OllamaProvider } from "./providers/ollama";
import { DeepSeekProvider } from "./providers/deepseek";

export type ProviderName = "ollama" | "deepseek";

export function getLLMProvider(providerName?: string): LLMProvider {
  const provider = (providerName ?? process.env.LLM_PROVIDER ?? "ollama").toLowerCase();

  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    return new OllamaProvider({ baseUrl });
  }

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY ?? "";
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set");
    return new DeepSeekProvider({ apiKey });
  }

  throw new Error(`Unknown LLM_PROVIDER: ${provider}`);
}

export function getLLMModel(providerName?: string): string {
  if (providerName === "deepseek") {
    return process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  }
  return process.env.LLM_MODEL ?? "llama3";
}

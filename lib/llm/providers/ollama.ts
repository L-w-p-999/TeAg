import type { LLMChatRequest, LLMChatResponse, LLMProvider } from "../types";
import { normalizeMessages } from "../normalize";

type OllamaChatRequest = {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  stream?: boolean;
};

type OllamaChatResponse = {
  message?: { role: string; content: string };
  response?: string;
};

export class OllamaProvider implements LLMProvider {
  constructor(
    private readonly opts: {
      baseUrl: string;
    },
  ) {}

  async chat(req: LLMChatRequest): Promise<LLMChatResponse> {
    const url = new URL("/api/chat", this.opts.baseUrl);
    const payload: OllamaChatRequest = {
      model: req.model,
      messages: normalizeMessages(req.messages).flatMap((message) =>
        typeof message.content === "string" ? [{ role: message.role, content: message.content }] : [],
      ),
      stream: false,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama chat failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const content = data.message?.content ?? data.response ?? "";

    return { content, stop_reason: "end_turn" };
  }
}

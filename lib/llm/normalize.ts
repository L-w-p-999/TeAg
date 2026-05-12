import type { LLMMessage } from "./types";

function shouldMergeTextMessages(prev: LLMMessage, next: LLMMessage): boolean {
  return prev.role === next.role && typeof prev.content === "string" && typeof next.content === "string";
}

export function normalizeMessages(messages: LLMMessage[]): LLMMessage[] {
  const normalized: LLMMessage[] = [];

  for (const message of messages) {
    if (typeof message.content === "string" && message.content.trim() === "") {
      continue;
    }

    const prev = normalized[normalized.length - 1];
    if (prev && shouldMergeTextMessages(prev, message)) {
      prev.content = `${prev.content}\n\n${message.content}`;
      continue;
    }

    normalized.push({ ...message });
  }

  return normalized;
}

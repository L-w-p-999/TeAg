export type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type TextBlock = {
  type: "text";
  text: string;
};

export type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
};

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string | ToolResultBlock[] | ToolUseBlock[];
};

export type LLMChatRequest = {
  model: string;
  messages: LLMMessage[];
  tools?: ToolDefinition[];
};

export type LLMChatResponse = {
  content: string;
  stop_reason: "end_turn" | "tool_use" | "stop";
  tool_uses?: ToolUseBlock[];
};

export interface LLMProvider {
  chat(req: LLMChatRequest): Promise<LLMChatResponse>;
}

import type { ToolDefinition } from "@/lib/llm/types";

export type ToolContext = {
  chatId: string;
};

export type ToolHandler = (args: Record<string, unknown>, context: ToolContext) => Promise<string>;

export type AgentTool = {
  definition: ToolDefinition;
  handler: ToolHandler;
};

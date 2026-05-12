import type { ToolDefinition } from "@/lib/llm/types";
import { exportChatMarkdownTool } from "./export-chat-markdown";
import type { AgentTool, ToolContext } from "./types";
import { weatherTool } from "./weather";

const tools: AgentTool[] = [weatherTool, exportChatMarkdownTool];

export const toolDefinitions: ToolDefinition[] = tools.map((tool) => tool.definition);

const toolHandlers = new Map(tools.map((tool) => [tool.definition.name, tool.handler]));

export async function dispatchTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<string> {
  const handler = toolHandlers.get(name);
  if (!handler) {
    return `Unknown tool: ${name}`;
  }

  return handler(input, context);
}

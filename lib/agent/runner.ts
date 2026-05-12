import type { LLMMessage, ToolResultBlock } from "@/lib/llm/types";
import type { LLMProvider } from "@/lib/llm/types";
import { dispatchTool, toolDefinitions } from "./tools/registry";
import type { ToolContext } from "./tools/types";

type LoopState = {
  messages: LLMMessage[];
  turn_count: number;
  transition_reason: "tool_result" | null;
};

const MAX_TURNS = 10;

export async function agentRun(
  userQuery: string,
  history: LLMMessage[],
  provider: LLMProvider,
  model: string,
  systemPrompt?: string,
  toolContext?: ToolContext,
): Promise<string> {
  const systemMessage = systemPrompt?.trim();

  const state: LoopState = {
    messages: [
      ...(systemMessage ? [{ role: "system" as const, content: systemMessage }] : []),
      ...history,
      { role: "user" as const, content: userQuery },
    ],
    turn_count: 1,
    transition_reason: null,
  };

  console.log(`[Agent] Start. model=${model}, messages=${state.messages.length}`);

  const context = toolContext ?? { chatId: "" };

  while (state.turn_count <= MAX_TURNS) {
    console.log(`[Agent] Turn ${state.turn_count}, reason: ${state.transition_reason ?? "initial"}`);

    // Step 2: 调用模型
    let response;
    try {
      response = await provider.chat({ model, messages: state.messages, tools: toolDefinitions });
      console.log(`[Agent] stop_reason=${response.stop_reason}, tool_uses=${response.tool_uses?.length ?? 0}`);
    } catch (e) {
      console.error("[Agent] provider.chat threw:", e);
      throw e;
    }

    // Step 3: assistant 回复写回 messages
    if (response.tool_uses && response.tool_uses.length > 0) {
      state.messages.push({ role: "assistant", content: response.tool_uses });
    } else {
      state.messages.push({ role: "assistant", content: response.content });
    }

    // Step 4: 判断是否继续
    if (response.stop_reason !== "tool_use" || !response.tool_uses?.length) {
      state.transition_reason = null;
      return response.content;
    }

    // Step 5: 执行工具
    const toolResults: ToolResultBlock[] = [];
    for (const toolUse of response.tool_uses) {
      console.log(`[Agent] Calling tool: ${toolUse.name}`, toolUse.input);
      let result: string;
      try {
        result = await dispatchTool(toolUse.name, toolUse.input as Record<string, unknown>, context);
        console.log(`[Agent] Tool result: ${result}`);
      } catch (e) {
        result = `工具执行失败: ${e instanceof Error ? e.message : String(e)}`;
      }
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
    }

    // Step 6: tool_result 写回 messages
    state.messages.push({ role: "user", content: toolResults });
    state.turn_count += 1;
    state.transition_reason = "tool_result";
  }

  return "Agent 达到最大轮次限制，任务未完成";
}

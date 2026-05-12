import type { LLMChatRequest, LLMChatResponse, LLMProvider, ToolDefinition, ToolUseBlock } from "../types";
import { normalizeMessages } from "../normalize";

// DeepSeek API 的消息格式
// content 可以是字符串，也可以是 null（当有 tool_calls 时）
type DeepSeekMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: ""; tool_calls: DeepSeekToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string }; // 工具结果消息

// DeepSeek API 的工具格式（OpenAI 兼容格式）
type DeepSeekTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition["parameters"];
  };
};

// DeepSeek API 返回的 tool_call 格式
type DeepSeekToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON 字符串，需要 parse
  };
};

type DeepSeekResponse = {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: DeepSeekToolCall[];
    };
    finish_reason?: string; // "stop" | "tool_calls" | "length"
  }[];
};

export class DeepSeekProvider implements LLMProvider {
  constructor(
    private readonly opts: {
      apiKey: string;
      baseUrl?: string;
    },
  ) {}

  async chat(req: LLMChatRequest): Promise<LLMChatResponse> {
    const baseUrl = this.opts.baseUrl ?? "https://api.deepseek.com";
    const url = new URL("/chat/completions", baseUrl);

    // 把我们内部的 LLMMessage 格式转成 DeepSeek API 格式
    // 关键：tool_result 消息必须紧跟在有 tool_calls 的 assistant 消息后面
    // 所以我们先扫一遍，找出哪些 assistant 消息真的有 tool_calls，
    // 只有这些消息后面的 tool_result 才是合法的
    const messages: DeepSeekMessage[] = [];

    const normalizedMessages = normalizeMessages(req.messages);

    for (let i = 0; i < normalizedMessages.length; i++) {
      const m = normalizedMessages[i];

      if (typeof m.content === "string") {
        // 普通文字消息（system / user / assistant 普通回复）
        if (m.content.trim() !== "") {
          messages.push({ role: m.role, content: m.content });
        }
      } else if (Array.isArray(m.content) && m.content.length > 0) {
        const first = m.content[0];

        if ("tool_use_id" in first) {
          // 这是 tool_result 数组（role: "user"）
          // 只有前一条 assistant 消息有 tool_calls 时才能发送
          const prevMsg = messages[messages.length - 1];
          const prevHasToolCalls =
            prevMsg?.role === "assistant" &&
            "tool_calls" in prevMsg &&
            Array.isArray((prevMsg as { tool_calls?: unknown[] }).tool_calls) &&
            ((prevMsg as { tool_calls?: unknown[] }).tool_calls?.length ?? 0) > 0;

          if (!prevHasToolCalls) {
            // 前面没有 tool_calls，跳过这条 tool_result，避免 400 错误
            console.warn("[DeepSeek] Skipping orphan tool_result (no preceding tool_calls)");
            continue;
          }

          // 合法的 tool_result，每个 block 单独一条 role: "tool" 消息
          for (const block of m.content) {
            if ("tool_use_id" in block) {
              messages.push({
                role: "tool",
                content: block.content,
                tool_call_id: block.tool_use_id,
              });
            }
          }
        } else if ("type" in first && first.type === "tool_use") {
          // 这是 assistant 发出的 tool_use 数组，转成带 tool_calls 的 assistant 消息
          const toolCalls = (m.content as Array<{ type: string; id: string; name: string; input: Record<string, unknown> }>)
            .filter((b) => b.type === "tool_use")
            .map((b) => ({
              id: b.id,
              type: "function" as const,
              function: {
                name: b.name,
                arguments: JSON.stringify(b.input),
              },
            }));

          messages.push({
            role: "assistant",
            content: "",
            tool_calls: toolCalls,
          });
        }
      }
    }

    // 把工具定义转成 DeepSeek 的格式
    const tools: DeepSeekTool[] | undefined = req.tools?.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const body: Record<string, unknown> = {
      model: req.model,
      messages,
    };

    // 只有有工具时才传 tools 字段
    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = "auto"; // 让模型自己决定要不要调工具
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.opts.apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`DeepSeek chat failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as DeepSeekResponse;
    const choice = data.choices?.[0];
    const message = choice?.message;
    const finishReason = choice?.finish_reason;

    // 判断模型是否要调工具
    if (finishReason === "tool_calls" && message?.tool_calls?.length) {
      // 把 DeepSeek 的 tool_calls 格式转成我们内部的 ToolUseBlock 格式
      const tool_uses: ToolUseBlock[] = message.tool_calls.map((tc) => ({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      }));

      return {
        content: "", // tool_use 时没有文字内容
        stop_reason: "tool_use",
        tool_uses,
      };
    }

    // 普通文字回复
    const content = message?.content ?? "";
    return {
      content: content || "",
      stop_reason: "end_turn",
    };
  }
}

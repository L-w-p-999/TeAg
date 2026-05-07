import { NextResponse } from "next/server";
import { appendMessage, getChat } from "@/lib/chat/store";
import { getLLMModel, getLLMProvider } from "@/lib/llm";
import type { LLMMessage } from "@/lib/llm/types";
import { agentRun } from "@/lib/agent/runner";

export async function POST(req: Request, ctx: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as
    | null
    | { content?: string; provider?: string; model?: string; systemPrompt?: string };
  const content = body?.content?.trim() ?? "";
  const systemPrompt = body?.systemPrompt?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ error: "empty_content" }, { status: 400 });
  }
  const providerName = body?.provider;

  const existing = await getChat(chatId);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await appendMessage(chatId, { role: "user", content });

  const latest = await getChat(chatId);
  if (!latest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 历史消息：排除刚刚存入的最后一条 user 消息（agentRun 会自己加）
  const history: LLMMessage[] = latest.messages
    .slice(0, -1) // 去掉最后一条（就是刚存的 user 消息）
    .map((m) => ({ role: m.role, content: m.content }));

  let replyContent: string;
  try {
    const provider = getLLMProvider(providerName);
    const model = body?.model || getLLMModel(providerName);
    replyContent = await agentRun(
      content,   // 用户本次输入（agentRun 内部会追加到 messages 末尾）
      history,   // 纯历史，不含本次 user 消息，不含 systemPrompt
      provider,
      model,
      systemPrompt,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Agent Error]", msg);
    replyContent = `模型响应失败: ${msg}`;
  }

  await appendMessage(chatId, { role: "assistant", content: replyContent });
  const updated = await getChat(chatId);

  return NextResponse.json({ chat: updated });
}

import { promises as fs } from "fs";
import path from "path";
import { getChat } from "@/lib/chat/store";
import type { AgentTool } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const EXPORT_DIR = path.join(DATA_DIR, "exports");

function escapeMarkdown(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function formatChatMarkdown(chat: NonNullable<Awaited<ReturnType<typeof getChat>>>): string {
  const lines = [
    `# ${chat.title || "新对话"}`,
    "",
    `- Chat ID: \`${chat.id}\``,
    `- Created: ${new Date(chat.createdAt).toISOString()}`,
    `- Updated: ${new Date(chat.updatedAt).toISOString()}`,
    "",
  ];

  for (const message of chat.messages) {
    const role = message.role === "user" ? "User" : "Assistant";
    lines.push(`## ${role}`);
    lines.push("");
    lines.push(`_Time: ${new Date(message.createdAt).toISOString()}_`);
    lines.push("");
    lines.push(message.content.trim() || "(empty)");
    lines.push("");
  }

  lines.push("## Message Index");
  lines.push("");
  lines.push("| Role | Created | Preview |");
  lines.push("| --- | --- | --- |");
  for (const message of chat.messages) {
    const preview = message.content.replace(/\s+/g, " ").trim().slice(0, 80);
    lines.push(`| ${message.role} | ${new Date(message.createdAt).toISOString()} | ${escapeMarkdown(preview)} |`);
  }
  lines.push("");

  return lines.join("\n");
}

export const exportChatMarkdownTool: AgentTool = {
  definition: {
    name: "export_chat_markdown",
    description: "将当前聊天内容导出为 Markdown 文件，并返回导出文件路径和摘要。",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  async handler(_args, context) {
    if (!context.chatId) {
      return JSON.stringify({ ok: false, error: "缺少当前 chatId，无法导出聊天。" });
    }

    const chat = await getChat(context.chatId);
    if (!chat) {
      return JSON.stringify({ ok: false, error: `会话不存在: ${context.chatId}` });
    }

    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const filePath = path.join(EXPORT_DIR, `${chat.id}.md`);
    const markdown = formatChatMarkdown(chat);
    await fs.writeFile(filePath, markdown, "utf8");

    return JSON.stringify({
      ok: true,
      chatId: chat.id,
      title: chat.title,
      messageCount: chat.messages.length,
      path: filePath,
    });
  },
};

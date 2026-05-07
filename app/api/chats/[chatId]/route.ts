import { NextResponse } from "next/server";
import { getChat } from "@/lib/chat/store";

export async function GET(_: Request, ctx: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await ctx.params;
  const chat = await getChat(chatId);
  if (!chat) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ chat });
}


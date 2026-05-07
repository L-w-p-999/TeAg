import { NextResponse } from "next/server";
import { createChat, listChats } from "@/lib/chat/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20") || 20, 50);
  const cursorParam = url.searchParams.get("cursor");
  const cursor = cursorParam ? Number(cursorParam) : undefined;

  const { items, nextCursor } = await listChats({ cursor, limit });
  return NextResponse.json({ items, nextCursor });
}

export async function POST() {
  const chat = await createChat();
  return NextResponse.json({ chatId: chat.id });
}


import { NextResponse } from "next/server";
import { getSystemPrompt, setSystemPrompt } from "@/lib/system-prompt/cache";

export async function GET() {
  return NextResponse.json({ systemPrompt: await getSystemPrompt() });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { systemPrompt?: string };
  const systemPrompt = await setSystemPrompt(body?.systemPrompt ?? "");

  return NextResponse.json({ systemPrompt });
}

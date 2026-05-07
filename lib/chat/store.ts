import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type ChatSummary = Pick<Chat, "id" | "title" | "updatedAt" | "createdAt">;

type DBShape = {
  chats: Chat[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "chats.json");

async function ensureDB(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    const initial: DBShape = { chats: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDB(): Promise<DBShape> {
  await ensureDB();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as DBShape;
}

async function writeDB(db: DBShape): Promise<void> {
  await ensureDB();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function listChats(opts: { cursor?: number; limit: number }): Promise<{
  items: ChatSummary[];
  nextCursor?: number;
}> {
  const db = await readDB();
  const sorted = [...db.chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const { cursor } = opts;
  const startIdx = cursor ? sorted.findIndex((c) => c.updatedAt < cursor) : 0;
  const sliceFrom = startIdx < 0 ? sorted.length : startIdx;
  const page = sorted.slice(sliceFrom, sliceFrom + opts.limit);
  const items = page.map(({ id, title, updatedAt, createdAt }) => ({ id, title, updatedAt, createdAt }));
  const last = page[page.length - 1];
  const nextCursor = last ? last.updatedAt : undefined;
  return { items, nextCursor };
}

export async function createChat(): Promise<Chat> {
  const now = Date.now();
  const chat: Chat = {
    id: newId("chat"),
    title: "新对话",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  const db = await readDB();
  db.chats.unshift(chat);
  await writeDB(db);
  return chat;
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const db = await readDB();
  return db.chats.find((c) => c.id === chatId) ?? null;
}

export async function appendMessage(chatId: string, msg: Omit<ChatMessage, "id" | "createdAt"> & { createdAt?: number }): Promise<Chat> {
  const db = await readDB();
  const chat = db.chats.find((c) => c.id === chatId);
  if (!chat) throw new Error("Chat not found");
  const now = msg.createdAt ?? Date.now();
  const message: ChatMessage = {
    id: newId("msg"),
    role: msg.role,
    content: msg.content,
    createdAt: now,
  };
  chat.messages.push(message);
  chat.updatedAt = now;
  if (chat.title === "新对话" && msg.role === "user") {
    chat.title = msg.content.trim().slice(0, 24) || "新对话";
  }
  await writeDB(db);
  return chat;
}


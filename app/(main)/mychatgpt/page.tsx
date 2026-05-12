"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Spin, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useModel } from "@/lib/store/modelContext";

const HOME_SAMPLES = [
  "今天想聊点什么？我可以帮你写代码、改简历、做产品方案。",
  "把你的需求说清楚一点：目标、限制条件、期望输出。",
  "你可以直接贴代码或报错信息，我会按步骤帮你定位并修复。",
  "想复现 ChatGPT UI？我们可以从布局、滚动、输入框交互开始。",
];

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-message text-sm leading-6 text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-3 mt-1 text-2xl font-semibold leading-8">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-1 text-xl font-semibold leading-7">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-1 text-lg font-semibold leading-7">{children}</h3>,
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-gray-300 pl-3 text-gray-600">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.92em] text-gray-900">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-md bg-gray-950 p-3 text-sm leading-6 text-gray-50">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-gray-200 bg-gray-100 px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-gray-200 px-3 py-2">{children}</td>,
          a: ({ children, href }) => (
            <a className="text-blue-600 underline underline-offset-2" href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ChatGPTLikeHome() {
  const [value, setValue] = useState("");
  const [typed, setTyped] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { selected } = useModel();
  const fullText = useMemo(() => HOME_SAMPLES[0], []);

  useEffect(() => {
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) {
        window.clearInterval(timer);
      }
    }, 22);
    return () => window.clearInterval(timer);
  }, [fullText]);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const chatRes = await fetch("/api/chats", { method: "POST" });
      const chatData = (await chatRes.json()) as { chatId: string };
      await fetch(`/api/chats/${encodeURIComponent(chatData.chatId)}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          provider: selected.provider,
          model: selected.model,
        }),
      });
      setValue("");
      // 通知侧边栏刷新聊天列表
      window.dispatchEvent(new Event("chat-updated"));
      router.push(`/mychatgpt?chatId=${encodeURIComponent(chatData.chatId)}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[760px] flex-col items-center justify-center gap-6 px-2 translate-y-[-10%]">
      <div className="w-full text-center">
        <Typography.Title  style={{ fontSize:28, marginBottom: 12, fontWeight:"normal"}}>
         {typed}
        </Typography.Title>
      </div>

      <div className="w-full">
        <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-end gap-2 !rounded-full border border-gray-200 bg-white px-2 py-2 shadow-sm">
          <Button
            aria-label="more"
            type="text"
            size="small"
            icon={<PlusOutlined />}
            shape="circle"
            className="!h-10 !w-10 !min-w-10 !p-0"
          />

          <Input.TextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="发送消息"
            autoSize={{ minRows: 1, maxRows: 6 }}
            variant="borderless"
            className="!px-1 !mb-1 rounded-[22px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <Button
            aria-label="send"
            type="primary"
            size="small"
            icon={<ArrowUpOutlined style={{ fontSize: 16, fontWeight: "bold" }} />}
            onClick={handleSend}
            shape="circle"
            className="!h-10 !w-10 !min-w-10 !p-0 !bg-black"
            disabled={sending}
          />
        </div>
        {sending ? (
          <div className="mt-3 flex w-full items-center justify-center text-xs text-gray-400">
            <Spin size="small" />
            <span className="ml-2">正在生成回复…</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChatThread({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { selected } = useModel();

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { chat: Chat };
      setChat(data.chat);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const handleSend = async () => {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      // 乐观追加用户消息
      setChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                { id: `tmp_${Date.now()}`, role: "user", content, createdAt: Date.now() },
              ],
            }
          : prev,
      );
      setValue("");

      const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          provider: selected.provider,
          model: selected.model,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { chat: Chat };
      setChat(data.chat);
      // 通知侧边栏刷新聊天列表
      window.dispatchEvent(new Event("chat-updated"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <Typography.Text type="secondary">会话不存在或已被删除。</Typography.Text>
        <Button onClick={() => router.push("/mychatgpt")}>回到首页</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        <div className="mx-auto w-full max-w-[760px] space-y-4">
          {chat.messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={[
                  "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6",
                  m.role === "user" ? "bg-black text-white" : "bg-gray-50 text-gray-800",
                ].join(" ")}
              >
                {m.role === "assistant" ? (
                  <MarkdownMessage content={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                正在生成回复…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-none border-t border-gray-100 pt-3">
        <div className="mx-auto w-full max-w-[760px]">
          <div className="grid w-full grid-cols-[40px_minmax(0,1fr)_40px] items-end gap-2 rounded-full border border-gray-200 bg-white px-2 py-2 shadow-sm">
            <Button
              aria-label="more"
              type="text"
              size="small"
              icon={<PlusOutlined />}
              shape="circle"
              className="!h-10 !w-10 !min-w-10 !p-0"
            />

            <Input.TextArea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="发送消息"
              autoSize={{ minRows: 1, maxRows: 6 }}
             variant="borderless"
              className="!px-1 !mb-1 rounded-[22px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <Button
              aria-label="send"
              type="primary"
              size="small"
              icon={<ArrowUpOutlined style={{ fontSize: 16, fontWeight: "bold" }} />}
              onClick={handleSend}
              shape="circle"
              className="!h-10 !w-10 !min-w-10 !p-0 !bg-black"
              disabled={sending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MyChatGPTPageInner() {
  const searchParams = useSearchParams();

  const chatId = useMemo(() => searchParams.get("chatId")?.trim() || "", [searchParams]);

  if (!chatId) {
    return <ChatGPTLikeHome />;
  }

  return <ChatThread chatId={chatId} />;
}

export default function MyChatGPTPage() {
  return (
    <Suspense fallback={<div className="h-full w-full" />}>
      <MyChatGPTPageInner />
    </Suspense>
  );
}

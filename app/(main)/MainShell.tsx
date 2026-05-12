"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloseOutlined,
  DownOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Drawer, Dropdown, Input, Layout, List, Menu, Spin, theme, Typography } from "antd";
import type { MenuProps } from "antd";
import { MODEL_OPTIONS, useModel } from "@/lib/store/modelContext";
import ToggleButton from "../ui/mychatgpt/toggleButton";
const { Header, Sider, Content } = Layout;
const PAGE_SIZE = 20;
type ChatSummary = {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
};

export default function MainShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [visibleChats, setVisibleChats] = useState<ChatSummary[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const router = useRouter();
  const { token } = theme.useToken();
  const {
    selected,
    setSelected,
    systemPrompt,
    draftSystemPrompt,
    setDraftSystemPrompt,
    applySystemPrompt,
    rightSidebarOpen,
    setRightSidebarOpen,
  } = useModel();
  const moreListRef = useRef<HTMLDivElement>(null);

  const handleCreateChat = () => {
    router.push("/mychatgpt");
  };

  const loadMoreChats = () => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    const url = new URL("/api/chats", window.location.origin);
    url.searchParams.set("limit", String(PAGE_SIZE));
    if (cursor) url.searchParams.set("cursor", String(cursor));
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<{ items: ChatSummary[]; nextCursor?: number }>;
      })
      .then((data) => {
        setVisibleChats((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
        setHasMore(Boolean(data.nextCursor) && data.items.length > 0);
      })
      .catch(() => {
        // ignore for now
      })
      .finally(() => setLoadingMore(false));
  };

  const refreshChatList = () => {
    setVisibleChats([]);
    setCursor(undefined);
    setHasMore(true);
    if (moreOpen) {
      loadMoreChats();
    }
  };

  const handleToggleMore = () => {
    const nextOpen = !moreOpen;
    setMoreOpen(nextOpen);
    if (nextOpen && visibleChats.length === 0) {
      setCursor(undefined);
      setHasMore(true);
      loadMoreChats();
    }
  };

  const handleMoreListScroll = () => {
    const listElement = moreListRef.current;
    if (!listElement || loadingMore || !hasMore) {
      return;
    }
    if (listElement.scrollTop + listElement.clientHeight >= listElement.scrollHeight - 24) {
      loadMoreChats();
    }
  };

  // 大屏场景：如果列表没撑出滚动条，就不会触发 onScroll；这里自动补齐直到出现滚动或加载完。
  useEffect(() => {
    if (!moreOpen) return;
    const el = moreListRef.current;
    if (!el) return;
    if (loadingMore || !hasMore) return;

    const raf = window.requestAnimationFrame(() => {
      const listEl = moreListRef.current;
      if (!listEl || loadingMore || !hasMore) return;
      if (listEl.scrollHeight <= listEl.clientHeight + 8) {
        loadMoreChats();
      }
    });

    return () => window.cancelAnimationFrame(raf);
  }, [moreOpen, visibleChats.length, loadingMore, hasMore]);

  useEffect(() => {
    if (!moreOpen) return;
    const el = moreListRef.current;
    if (!el) return;

    const ensureFilled = () => {
      const listEl = moreListRef.current;
      if (!listEl || loadingMore || !hasMore) return;
      if (listEl.scrollHeight <= listEl.clientHeight + 8) {
        loadMoreChats();
      }
    };

    // 容器尺寸变化（更大屏/侧边栏收缩展开）时也补齐列表
    const ro = new ResizeObserver(() => ensureFilled());
    ro.observe(el);
    ensureFilled();

    return () => ro.disconnect();
  }, [moreOpen, loadingMore, hasMore]);

  const handleOpenMockChat = (chatId: string) => {
    router.push(`/mychatgpt?chatId=${encodeURIComponent(chatId)}`);
  };

  // 监听聊天更新事件
  useEffect(() => {
    const handleChatUpdate = () => {
      refreshChatList();
    };
    window.addEventListener("chat-updated", handleChatUpdate);
    return () => window.removeEventListener("chat-updated", handleChatUpdate);
  }, [moreOpen]);

  const menuItems: MenuProps["items"] = [
    {
      key: "create-chat",
      icon: <EditOutlined />,
      label: "创建聊天",
      onClick: handleCreateChat,
    },
    {
      key: "search-chat",
      icon: <SearchOutlined />,
      label: "搜索聊天",
    }
  ];

  const appTheme = {
    token: {
      colorPrimary: "#1677ff",
      borderRadius: 10,
      colorBgLayout: "#f7f8fa",
    },
    components: {
      Layout: { headerHeight: 52 },
      Menu: { itemHeight: 36, itemBorderRadius: 10, itemMarginBlock: 4},
      Button: { controlHeight: 30 },
    },
  };

  return (
    <ConfigProvider theme={appTheme}>
      <Layout className="h-dvh overflow-hidden">
        <Sider
          collapsible
          width={280}
          collapsedWidth={84}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          
          className="h-full overflow-hidden border-r border-r-[#f0f0f0] !bg-[#f8f8fa]"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex h-14 flex-none items-center justify-between overflow-hidden whitespace-nowrap px-2.5">
              <div className="flex items-center justify-center">
                {collapsed ? (
                  <ToggleButton
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    text="GPT"
                    className="!h-9 px-2 !text-[18px] !font-bold tracking-[0.02em] !text-gray-500"
                  />
                ) : (
                  <div className="text-[18px] font-bold tracking-[0.01em] text-gray-500">My ChatGPT</div>
                )}
              </div>
              {!collapsed ? (
                <div>
                  <ToggleButton
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    icon={<MenuFoldOutlined />}
                    className="!h-[34px] !w-[34px] !min-w-[34px] !p-0 !text-gray-500 [&_.anticon]:text-base"
                  />
                </div>
              ) : (
                ""
              )}
            </div>

            <Menu
              mode="inline"
              items={menuItems}
              selectable={false}
              selectedKeys={[]}
              className="flex-none !mt-2 !border-e-0 !bg-[#f8f8fa] [&_.ant-menu-item]:!min-h-9 [&_.ant-menu-item]:!leading-9 [&_.ant-menu-item]:!px-3 [&_.ant-menu-item]:!py-0 [&_.ant-menu-submenu-title]:!min-h-9 [&_.ant-menu-submenu-title]:!leading-9 [&_.ant-menu-submenu-title]:!px-3 [&_.ant-menu-submenu-title]:!py-0 [&_.ant-menu-inline-collapsed>.ant-menu-item]:!min-h-9 [&_.ant-menu-inline-collapsed>.ant-menu-item]:!leading-9 [&_.ant-menu-inline-collapsed>.ant-menu-submenu>.ant-menu-submenu-title]:!min-h-9 [&_.ant-menu-inline-collapsed>.ant-menu-submenu>.ant-menu-submenu-title]:!leading-9 [&_.ant-menu-inline-collapsed>.ant-menu-item]:!px-2 [&_.ant-menu-inline-collapsed>.ant-menu-item]:!py-0 [&_.ant-menu-inline-collapsed>.ant-menu-submenu>.ant-menu-submenu-title]:!px-2 [&_.ant-menu-inline-collapsed>.ant-menu-submenu>.ant-menu-submenu-title]:!py-0 [&_.ant-menu-inline-collapsed_.ant-menu-item-icon]:!text-[18px] [&_.ant-menu-inline-collapsed_.anticon]:!text-[18px]"
            />

            {!collapsed?
            <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-t-[#f0f0f0] px-2 py-2">
              <Button
                type="text"
                onClick={handleToggleMore}
                className="!h-9 !flex !items-center !justify-between !w-full !px-2 !text-sm !font-semibold !text-gray-500"
                icon={moreOpen ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
              >
                更多
              </Button>

              {moreOpen ? (
                <div
                  ref={moreListRef}
                  onScroll={handleMoreListScroll}
                  className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
                >
                  <List
                    size="small"
                    dataSource={visibleChats}
                    split={false}
                    locale={{ emptyText: loadingMore ? " " : "暂无聊天" }}
                    renderItem={(chat) => (
                      <List.Item className="!px-0 !py-0">
                        <Button
                          type="text"
                          onClick={() => handleOpenMockChat(chat.id)}
                          className="!h-9 !w-full !justify-start !px-2 !text-left !text-sm !text-gray-600"
                          title={chat.title}
                        >
                          <span className="block w-full truncate">{chat.title}</span>
                        </Button>
                      </List.Item>
                    )}
                  />
                  {loadingMore ? (
                    <div className="flex items-center justify-center px-2 py-2">
                      <Spin size="small" />
                    </div>
                  ) : null}
                  {!hasMore && visibleChats.length > 0 ? (
                    <div className="px-2 py-2 text-center text-xs text-gray-400">已经到底了</div>
                  ) : null}
                </div>
              ) : null}
            </div>:''}
          </div>

        </Sider>

        <Layout className="h-full min-h-0">
          <Header
            className="flex h-14 justify-between items-center gap-2 !px-6"
            style={{
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Dropdown
              menu={{
                items: MODEL_OPTIONS.map((opt) => ({
                  key: `${opt.provider}::${opt.model}`,
                  label: opt.label,
                  onClick: () => setSelected(opt),
                })),
                selectedKeys: [`${selected.provider}::${selected.model}`],
              }}
              trigger={["click"]}
            >
              <Button
                type="text"
                className="!px-2 !text-[18px] !font-bold !tracking-[0.01em] !text-gray-500"
              >
                {selected.label} <DownOutlined className="!text-xs !text-gray-400" />
              </Button>
            </Dropdown>

            <Button
              type="text"
              icon={rightSidebarOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="!h-[34px] !w-[34px] !min-w-[34px] !p-0 !text-gray-500 [&_.anticon]:text-base"
            />
          </Header>

          <Content className="min-h-0 flex-1 overflow-hidden p-4 max-md:p-3 bg-white">
            {children}
          </Content>
        </Layout>

        <Sider
          width={320}
          collapsedWidth={0}
          collapsed={!rightSidebarOpen}
          trigger={null}
          reverseArrow
          className={`h-full overflow-hidden !bg-[#fafafa] ${rightSidebarOpen ? "border-l border-l-[#f0f0f0]" : ""}`}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex h-14 flex-none items-center justify-between border-b border-b-[#f0f0f0] px-4">
              <Typography.Text className="!mb-0 !text-sm !font-semibold !text-gray-700">
                高级设置
              </Typography.Text>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setRightSidebarOpen(false)}
                className="!h-8 !w-8 !min-w-8 !p-0 !text-gray-500"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Typography.Text className="!block !text-sm !font-medium !text-gray-800">
                      System Prompt
                    </Typography.Text>
                    <Typography.Text className="!block !text-xs !text-gray-400">
                      {systemPrompt.trim() ? "已配置提示词" : "当前未设置"}
                    </Typography.Text>
                  </div>
                  <Button type="primary" className="!bg-black" onClick={() => setPromptDrawerOpen(true)}>
                    配置
                  </Button>
                </div>
              </div>
              <div className="flex-1" />
            </div>
          </div>
        </Sider>

      </Layout>

      <Drawer
        title="编辑 System Prompt"
        placement="right"
        open={promptDrawerOpen}
        onClose={() => setPromptDrawerOpen(false)}
        width={420}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              await applySystemPrompt();
              setPromptDrawerOpen(false);
            }}
          >
            应用
          </Button>
        }
      >
        <div className="flex h-full flex-col gap-3">
          <Typography.Text className="!text-sm !text-gray-500">
            这里输入的内容会以 `system` 角色注入到后续 LLM 请求里。
          </Typography.Text>
          <Input.TextArea
            value={draftSystemPrompt}
            onChange={(e) => setDraftSystemPrompt(e.target.value)}
            placeholder="输入 system prompt"
            autoSize={{ minRows: 12, maxRows: 20 }}
          />
        </div>
      </Drawer>
    </ConfigProvider>
  );
}

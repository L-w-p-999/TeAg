"use client";

import { createContext, useContext, useState } from "react";

export type ModelOption = {
  label: string;
  provider: string;
  model: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
  { label: "Ollama · llama3", provider: "ollama", model: "llama3" },
  { label: "Ollama · qwen2.5", provider: "ollama", model: "qwen2.5" },
  { label: "DeepSeek · deepseek-chat", provider: "deepseek", model: "deepseek-chat" },
  { label: "DeepSeek · deepseek-reasoner", provider: "deepseek", model: "deepseek-reasoner" },
];

type ModelContextValue = {
  selected: ModelOption;
  setSelected: (opt: ModelOption) => void;
  systemPrompt: string;
  draftSystemPrompt: string;
  setDraftSystemPrompt: (value: string) => void;
  applySystemPrompt: () => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
};

const ModelContext = createContext<ModelContextValue>({
  selected: MODEL_OPTIONS[0],
  setSelected: () => {},
  systemPrompt: "",
  draftSystemPrompt: "",
  setDraftSystemPrompt: () => {},
  applySystemPrompt: () => {},
  rightSidebarOpen: true,
  setRightSidebarOpen: () => {},
});

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("my-chatgpt-system-prompt") ?? "";
  });
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("my-chatgpt-system-prompt") ?? "";
  });

  const applySystemPrompt = () => {
    setSystemPrompt(draftSystemPrompt);
    window.localStorage.setItem("my-chatgpt-system-prompt", draftSystemPrompt);
  };

  return (
    <ModelContext.Provider
      value={{
        selected,
        setSelected,
        systemPrompt,
        draftSystemPrompt,
        setDraftSystemPrompt,
        applySystemPrompt,
        rightSidebarOpen,
        setRightSidebarOpen,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  return useContext(ModelContext);
}

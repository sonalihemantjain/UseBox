import { useState, useEffect } from "react";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano" },
] as const;

const STORAGE_KEY = "usebox-selected-models";
const DEFAULTS = ["google/gemini-3-flash-preview", "openai/gpt-5-mini"];

export function useModelSelection() {
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      }
    } catch {}
    return DEFAULTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedModels));
  }, [selectedModels]);

  const setModel = (index: 0 | 1, modelId: string) => {
    setSelectedModels((prev) => {
      const next = [...prev];
      next[index] = modelId;
      return next;
    });
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, modelId];
    });
  };

  return { selectedModels, setModel, toggleModel, availableModels: AVAILABLE_MODELS };
}

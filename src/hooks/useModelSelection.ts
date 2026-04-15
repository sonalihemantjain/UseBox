import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano" },
] as const;

const DEFAULTS = ["google/gemini-3-flash-preview", "openai/gpt-5-mini"];

export function useModelSelection() {
  const { user } = useAuth();
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load from DB
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await api.getUserSettings(user.id);
        if (data?.selectedModels?.length === 2) {
          setSelectedModels(data.selectedModels);
        }
      } catch (e) {
        console.error("Failed to load model settings:", e);
      }
      setLoaded(true);
    })();
  }, [user]);

  // Save to DB
  const persist = useCallback(async (models: string[]) => {
    if (!user) return;
    try {
      await api.updateUserModels({ user_id: user.id, selected_models: models });
    } catch (e) {
      console.error("Failed to save model settings:", e);
    }
  }, [user]);

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      let next: string[];
      if (prev.includes(modelId)) {
        next = prev.filter((id) => id !== modelId);
      } else if (prev.length >= 2) {
        return prev;
      } else {
        next = [...prev, modelId];
      }
      if (next.length === 2) persist(next);
      return next;
    });
  }, [persist]);

  const setModel = useCallback((index: 0 | 1, modelId: string) => {
    setSelectedModels((prev) => {
      const next = [...prev];
      next[index] = modelId;
      persist(next);
      return next;
    });
  }, [persist]);

  return { selectedModels, setModel, toggleModel, availableModels: AVAILABLE_MODELS, loaded };
}

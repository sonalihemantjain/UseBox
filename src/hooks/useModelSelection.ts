import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
      const { data } = await supabase
        .from("user_settings")
        .select("selected_models")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.selected_models?.length === 2) {
        setSelectedModels(data.selected_models);
      }
      setLoaded(true);
    })();
  }, [user]);

  // Save to DB
  const persist = useCallback(async (models: string[]) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("user_settings").update({
        selected_models: models,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    } else {
      await supabase.from("user_settings").insert({
        user_id: user.id,
        selected_models: models,
      } as any);
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

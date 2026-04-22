import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const FALLBACK_SUGGESTIONS = [
  "How do I get started with product adoption strategies?",
  "Explain RAG architecture in simple terms",
  "What are best practices for onboarding enterprise users?",
  "Help me create a learning path for my team",
];

const DEBOUNCE_MS = 300;

export function useSuggestions(
  industry: string | null,
  functionalArea: string | null,
  persona: string | null
) {
  const [suggestions, setSuggestions] = useState<string[]>(FALLBACK_SUGGESTIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!industry || !functionalArea || !persona) {
      setSuggestions(FALLBACK_SUGGESTIONS);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .getSuggestions(
          { industry, functional_area: functionalArea, persona },
          controller.signal
        )
        .then((res) => {
          if (
            Array.isArray(res.suggestions) &&
            res.suggestions.length === 4 &&
            res.suggestions.every((s) => typeof s === "string" && s.trim())
          ) {
            setSuggestions(res.suggestions);
          } else {
            setSuggestions(FALLBACK_SUGGESTIONS);
          }
        })
        .catch((err) => {
          if ((err as { name?: string })?.name === "AbortError") return;
          setSuggestions(FALLBACK_SUGGESTIONS);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [industry, functionalArea, persona]);

  return { suggestions, loading };
}

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const FALLBACK_SUGGESTIONS = [
  "Compare Microsoft Copilot vs ChatGPT for enterprise use",
  "Where do I start with Microsoft Power Platform?",
  "How do I automate approvals without writing code?",
  "What AI skills are most in demand for 2025?",
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
    // Need at least persona to fetch dynamic suggestions
    if (!persona) {
      setSuggestions(FALLBACK_SUGGESTIONS);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(() => {
      api
        .getSuggestions(
          {
            industry: industry ?? undefined,
            functional_area: functionalArea ?? undefined,
            persona,
          },
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

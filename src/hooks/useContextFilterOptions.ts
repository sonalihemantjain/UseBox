import { useEffect, useState } from "react";

export type FilterOption = {
  key: string;
  display_name: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useContextFilterOptions() {
  const [functionalAreas, setFunctionalAreas] = useState<FilterOption[]>([]);
  const [industries, setIndustries] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      // Retry because backend may not be ready immediately after reload/dev start
      const maxAttempts = 3;
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const [faResp, indResp] = await Promise.all([
            fetch(`${API_URL}/api/functional-areas`, { signal }),
            fetch(`${API_URL}/api/industries`, { signal }),
          ]);

          if (!faResp.ok) throw new Error(`functional areas failed (${faResp.status})`);
          if (!indResp.ok) throw new Error(`industries failed (${indResp.status})`);

          const [faData, indData] = await Promise.all([faResp.json(), indResp.json()]);
          setFunctionalAreas((faData.functionalAreas || []) as FilterOption[]);
          setIndustries((indData.industries || []) as FilterOption[]);
          return;
        } catch (e) {
          lastErr = e;
          if (signal?.aborted) return;
          if (attempt < maxAttempts) {
            await sleep(350 * attempt);
            continue;
          }
        }
      }
      throw lastErr;
    } catch (e) {
      // Keep UI usable with empty options if backend not ready
      console.error("Failed to load context filter options:", e);
      setFunctionalAreas([]);
      setIndustries([]);
      setError(e instanceof Error ? e.message : "Failed to load filter options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abort = new AbortController();
    load(abort.signal);
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { functionalAreas, industries, loading, error, refetch: () => load() };
}


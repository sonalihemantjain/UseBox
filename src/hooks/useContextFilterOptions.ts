import { useEffect, useState } from "react";

export type FilterOption = {
  key: string;
  display_name: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Module-level cache to prevent redundant fetches
let cachedOptions: { functionalAreas: FilterOption[]; industries: FilterOption[] } | null = null;
let pendingLoad: Promise<void> | null = null;
let lastLoadError: string | null = null;

export function useContextFilterOptions() {
  const [functionalAreas, setFunctionalAreas] = useState<FilterOption[]>(cachedOptions?.functionalAreas || []);
  const [industries, setIndustries] = useState<FilterOption[]>(cachedOptions?.industries || []);
  const [loading, setLoading] = useState(!cachedOptions && !!pendingLoad);
  const [error, setError] = useState<string | null>(lastLoadError);

  const load = async (signal?: AbortSignal) => {
    if (cachedOptions) {
      setFunctionalAreas(cachedOptions.functionalAreas);
      setIndustries(cachedOptions.industries);
      setLoading(false);
      setError(null);
      return;
    }

    if (pendingLoad) {
      setLoading(true);
      await pendingLoad;
      if (cachedOptions) {
        setFunctionalAreas(cachedOptions.functionalAreas);
        setIndustries(cachedOptions.industries);
        setError(null);
      } else {
        setError(lastLoadError);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    pendingLoad = (async () => {
      lastLoadError = null;
      try {
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
            cachedOptions = {
              functionalAreas: (faData.functionalAreas || []) as FilterOption[],
              industries: (indData.industries || []) as FilterOption[],
            };
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
      } catch (e: any) {
        console.error("Failed to load context filter options:", e);
        lastLoadError = e?.message || "Failed to load filter options";
      } finally {
        pendingLoad = null;
      }
    })();

    await pendingLoad;
    if (cachedOptions) {
      setFunctionalAreas(cachedOptions.functionalAreas);
      setIndustries(cachedOptions.industries);
      setError(null);
    } else {
      setError(lastLoadError);
    }
    setLoading(false);
  };

  useEffect(() => {
    // If we have data, we don't need to do anything
    if (cachedOptions) {
      return;
    }
    // If a load is already in progress, just wait for it
    if (pendingLoad) {
       load();
       return;
    }
    
    const abort = new AbortController();
    load(abort.signal);
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    functionalAreas,
    industries,
    loading,
    error,
    refetch: () => {
      cachedOptions = null;
      lastLoadError = null;
      return load();
    },
  };
}

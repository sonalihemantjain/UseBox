import { useEffect, useState } from "react";

export type FilterOption = {
  key: string;
  display_name: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useContextFilterOptions() {
  const [functionalAreas, setFunctionalAreas] = useState<FilterOption[]>([]);
  const [industries, setIndustries] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [faResp, indResp] = await Promise.all([
          fetch(`${API_URL}/api/functional-areas`),
          fetch(`${API_URL}/api/industries`),
        ]);

        if (!faResp.ok) throw new Error(`functional areas failed (${faResp.status})`);
        if (!indResp.ok) throw new Error(`industries failed (${indResp.status})`);

        const [faData, indData] = await Promise.all([faResp.json(), indResp.json()]);
        if (cancelled) return;

        setFunctionalAreas((faData.functionalAreas || []) as FilterOption[]);
        setIndustries((indData.industries || []) as FilterOption[]);
      } catch (e) {
        // Keep UI usable with empty options if backend not ready
        console.error("Failed to load context filter options:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { functionalAreas, industries, loading };
}


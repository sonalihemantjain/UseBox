import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type PersonaOption = {
  key: string;
  display_name: string;
};

export function usePersonaOptions(functionalArea: string | null) {
  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const url = functionalArea
      ? `${API_URL}/api/personas?functional_area=${encodeURIComponent(functionalArea)}`
      : `${API_URL}/api/personas`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setPersonas(data.personas || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [functionalArea]);

  return { personas, loading };
}

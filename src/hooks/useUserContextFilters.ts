import { useCallback } from "react";
import { useUserContext } from "@/hooks/useUserContext";

export type UserContextFilters = {
  functionalArea: string | null;
  industry: string | null;
};

export function useUserContextFilters() {
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContext();

  return {
    functionalArea,
    industry,
    setFunctionalArea: useCallback((v: string | null) => setFunctionalArea(v), [setFunctionalArea]),
    setIndustry: useCallback((v: string | null) => setIndustry(v), [setIndustry]),
  };
}


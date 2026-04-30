import { useState, useCallback } from "react";

export type CustomOptionType = "industry" | "functionalArea" | "persona";

export interface CustomOption {
  id: string;
  key: string;
  display_name: string;
  type: CustomOptionType;
}

const STORAGE_KEY = "usebox_custom_options";

function load(): CustomOption[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CustomOption[];
  } catch {
    return [];
  }
}

function persist(opts: CustomOption[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
}

export function useCustomOptions() {
  const [options, setOptions] = useState<CustomOption[]>(() => load());

  const addOption = useCallback((type: CustomOptionType, display_name: string): CustomOption => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const key = `custom_${type}_${id}`;
    const entry: CustomOption = { id, key, display_name, type };
    setOptions(prev => {
      const next = [...prev, entry];
      persist(next);
      return next;
    });
    return entry;
  }, []);

  const deleteOption = useCallback((id: string) => {
    setOptions(prev => {
      const next = prev.filter(e => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const editOption = useCallback((id: string, display_name: string) => {
    setOptions(prev => {
      const next = prev.map(e => e.id === id ? { ...e, display_name } : e);
      persist(next);
      return next;
    });
  }, []);

  const getByType = useCallback((type: CustomOptionType): CustomOption[] => {
    return options.filter(e => e.type === type);
  }, [options]);

  return { options, addOption, deleteOption, editOption, getByType };
}

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type UserRole = "business" | "lowcode" | "developer" | "architect" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  business: "Business User",
  lowcode: "Low-Code Dev",
  developer: "Pro Developer",
  architect: "Architect",
  admin: "Administrator",
};

const STORAGE_KEY = "knowledge-user-role";

// Shared listeners for cross-component reactivity
let listeners: Array<() => void> = [];
function emitChange() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => { listeners = listeners.filter((l) => l !== listener); };
}
function getSnapshot(): UserRole | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved in ROLE_LABELS) return saved as UserRole;
  return null;
}

export function useUserRole() {
  const role = useSyncExternalStore(subscribe, getSnapshot);

  const setRole = useCallback((r: UserRole | null) => {
    if (r) {
      localStorage.setItem(STORAGE_KEY, r);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    emitChange();
  }, []);

  return { role, setRole };
}

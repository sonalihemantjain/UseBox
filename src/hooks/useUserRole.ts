import { useState, useEffect } from "react";

export type UserRole = "business" | "lowcode" | "developer" | "architect" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  business: "Business User",
  lowcode: "Low-Code Dev",
  developer: "Pro Developer",
  architect: "Architect",
  admin: "Administrator",
};

const STORAGE_KEY = "knowledge-user-role";

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in ROLE_LABELS) return saved as UserRole;
    return null; // New users have no persona
  });

  const setRole = (r: UserRole | null) => {
    setRoleState(r);
    if (r) {
      localStorage.setItem(STORAGE_KEY, r);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { role, setRole };
}

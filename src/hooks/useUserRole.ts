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
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as UserRole) || "business";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  return { role, setRole };
}

import { useCallback } from "react";
import { useUserContext } from "@/hooks/useUserContext";

export type UserRole = "businessuser" | "prodeveloper" | "architect" | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  businessuser: "Business User",
  prodeveloper: "Pro Developer",
  architect: "Architect",
  admin: "Administrator",
};

export function useUserRole() {
  const { role, setRole: setRoleFromCtx } = useUserContext();

  const setRole = useCallback(
    (r: UserRole | null) => {
      // Keep safety: ignore invalid roles
      if (r && !(r in ROLE_LABELS)) return;
      setRoleFromCtx(r);
    },
    [setRoleFromCtx]
  );

  return { role, setRole };
}

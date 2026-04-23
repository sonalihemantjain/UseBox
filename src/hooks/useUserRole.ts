import { useCallback } from "react";
import { useUserContext } from "@/hooks/useUserContext";

export type UserRole =
  | "businessuser"
  | "citizen_developer"
  | "prodeveloper"
  | "data_analyst"
  | "operations_manager"
  | "product_manager"
  | "architect"
  | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  businessuser:       "Business User",
  citizen_developer:  "Citizen Developer",
  prodeveloper:       "Pro Developer",
  data_analyst:       "Data Analyst",
  operations_manager: "Operations Manager",
  product_manager:    "Product Manager",
  architect:          "Solution Architect",
  admin:              "IT Admin",
};

export function useUserRole() {
  const { role, setRole: setRoleFromCtx } = useUserContext();

  const setRole = useCallback(
    (r: UserRole | null) => {
      if (r && !(r in ROLE_LABELS)) return;
      setRoleFromCtx(r);
    },
    [setRoleFromCtx]
  );

  return { role, setRole };
}

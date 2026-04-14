import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/hooks/useUserRole";
import { ensureUserSettingsLoaded, patchUserSettings, useUserSettingsStore } from "@/hooks/userSettingsStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type UserContext = {
  role: UserRole | null;
  functionalArea: string | null;
  industry: string | null;
};

export function useUserContext() {
  const { user, isReady } = useAuth();
  const store = useUserSettingsStore();

  const userId = user?.id || null;

  useEffect(() => {
    if (!isReady) return;
    ensureUserSettingsLoaded(userId);
  }, [isReady, userId]);

  const update = useCallback(
    async (partial: Partial<UserContext>) => {
      if (!userId) {
        patchUserSettings({ ...partial, loaded: true });
        return;
      }

      // Optimistic UI
      patchUserSettings(partial);

      try {
        const resp = await fetch(`${API_URL}/api/user-context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            role: partial.role ?? undefined,
            functionalArea: partial.functionalArea ?? undefined,
            industry: partial.industry ?? undefined,
          }),
        });
        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          throw new Error(`update user-context failed (${resp.status}) ${t}`);
        }
        const data = await resp.json().catch(() => null);
        if (data) {
          patchUserSettings({
            role: (data.role ?? null) as UserRole | null,
            functionalArea: data.functionalArea ?? null,
            industry: data.industry ?? null,
          });
        }
      } catch (e) {
        console.error("Failed to update user context:", e);
      }
    },
    [userId]
  );

  const setRole = useCallback((role: UserRole | null) => update({ role }), [update]);
  const setFunctionalArea = useCallback((functionalArea: string | null) => update({ functionalArea }), [update]);
  const setIndustry = useCallback((industry: string | null) => update({ industry }), [update]);

  return useMemo(
    () => ({
      role: store.role,
      functionalArea: store.functionalArea,
      industry: store.industry,
      setRole,
      setFunctionalArea,
      setIndustry,
      loaded: store.loaded,
      userId,
    }),
    [store.role, store.functionalArea, store.industry, store.loaded, setFunctionalArea, setIndustry, setRole, userId]
  );
}


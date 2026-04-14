import { useSyncExternalStore } from "react";
import type { UserRole } from "@/hooks/useUserRole";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export type SelectedPlatform = {
  id: string;
  name: string;
  display_name: string;
};

export type UserSettings = {
  userId: string | null;
  loaded: boolean;
  loading: boolean;
  role: UserRole | null;
  functionalArea: string | null;
  industry: string | null;
  selectedPlatforms: SelectedPlatform[];
};

let listeners: Array<() => void> = [];
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

let state: UserSettings = {
  userId: null,
  loaded: false,
  loading: false,
  role: null,
  functionalArea: null,
  industry: null,
  selectedPlatforms: [],
};

let inflight: Promise<void> | null = null;

function setState(next: Partial<UserSettings>) {
  state = { ...state, ...next };
  emit();
}

export function ensureUserSettingsLoaded(userId: string | null) {
  if (!userId) {
    if (state.userId !== null) {
      state = {
        userId: null,
        loaded: true,
        loading: false,
        role: null,
        functionalArea: null,
        industry: null,
        selectedPlatforms: [],
      };
      emit();
    }
    return;
  }

  // New user session → reset and load
  if (state.userId !== userId) {
    state = {
      userId,
      loaded: false,
      loading: false,
      role: null,
      functionalArea: null,
      industry: null,
      selectedPlatforms: [],
    };
    inflight = null;
    emit();
  }

  if (state.loaded || inflight) return;

  setState({ loading: true });
  inflight = (async () => {
    try {
      const resp = await fetch(`${API_URL}/api/user-settings/${userId}`);
      if (!resp.ok) throw new Error(`user-settings failed (${resp.status})`);
      const data = await resp.json();
      setState({
        role: (data.role ?? null) as UserRole | null,
        functionalArea: data.functionalArea ?? null,
        industry: data.industry ?? null,
        selectedPlatforms: (data.selectedPlatforms || []) as SelectedPlatform[],
        loaded: true,
        loading: false,
      });
    } catch (e) {
      console.error("Failed to load user settings:", e);
      setState({ loaded: true, loading: false });
    } finally {
      inflight = null;
    }
  })();
}

export function patchUserSettings(next: Partial<UserSettings>) {
  setState(next);
}

export function setSelectedPlatforms(selectedPlatforms: SelectedPlatform[]) {
  setState({ selectedPlatforms });
}

export function useUserSettingsStore() {
  return useSyncExternalStore(subscribe, () => state);
}


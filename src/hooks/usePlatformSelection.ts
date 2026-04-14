import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ensureUserSettingsLoaded,
  setSelectedPlatforms as setStoreSelectedPlatforms,
  useUserSettingsStore,
  type SelectedPlatform,
} from "@/hooks/userSettingsStore";

export type Platform = {
  id: string;
  name: string;
  display_name: string;
};

export type UserPlatform = {
  id: string;
  user_id: string;
  platform_id: string;
  is_selected: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function usePlatformSelection() {
  const { user, isReady } = useAuth();
  const settings = useUserSettingsStore();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load all available platforms from backend API
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_URL}/api/platforms`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.platforms) {
          console.log("✅ Loaded platforms from backend:", data.platforms);
          setPlatforms(data.platforms);
        }
      } catch (error) {
        console.error("Error loading platforms:", error);
        console.error("⚠️ Make sure backend API is running and /api/platforms endpoint exists");
      }
    })();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    ensureUserSettingsLoaded(user?.id || null);
  }, [isReady, user?.id]);

  const selectedPlatformIds = useMemo(
    () => (settings.selectedPlatforms || []).map((p) => p.id),
    [settings.selectedPlatforms]
  );

  // Initialize defaults for new users without platform selections
  useEffect(() => {
    if (!user || platforms.length === 0) return;
    if (!settings.loaded) return;

    if ((settings.selectedPlatforms || []).length > 0) {
      setLoaded(true);
      return;
    }

    console.log("ℹ️ No platform selections found. Creating default selections (all platforms)...");
    const all = platforms.map((p) => ({ id: p.id, name: p.name, display_name: p.display_name })) as SelectedPlatform[];
    setStoreSelectedPlatforms(all);

    (async () => {
      try {
        const initResponse = await fetch(`${API_URL}/api/user-platforms/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (initResponse.ok) {
          console.log("✅ Created default platform selections for user");
        }
      } catch (e) {
        console.error("Error creating default platform selections:", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [user, platforms, settings.loaded, settings.selectedPlatforms]);

  // Toggle platform selection via backend API
  const togglePlatform = useCallback(async (platformId: string) => {
    if (!user) return;

    const current = (settings.selectedPlatforms || []) as SelectedPlatform[];
    const isCurrentlySelected = current.some((p) => p.id === platformId);

    const platform = platforms.find((p) => p.id === platformId);
    const next = isCurrentlySelected
      ? current.filter((p) => p.id !== platformId)
      : platform
        ? [...current, { id: platform.id, name: platform.name, display_name: platform.display_name }]
        : current;

    // Optimistic store update
    setStoreSelectedPlatforms(next);

    try {
      const response = await fetch(`${API_URL}/api/user-platforms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          platform_id: platformId,
          is_selected: !isCurrentlySelected,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error("Error updating platform selection:", error);
    }
  }, [user, settings.selectedPlatforms, platforms]);

  // Get selected platforms (full objects)
  const selectedPlatforms = platforms.filter((p) =>
    selectedPlatformIds.includes(p.id)
  );

  return {
    platforms,
    selectedPlatformIds,
    selectedPlatforms,
    togglePlatform,
    loaded: loaded || settings.loaded,
  };
}

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([]);
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

  // Load user's platform selections from backend API
  useEffect(() => {
    if (!user || platforms.length === 0) return;

    (async () => {
      try {
        const response = await fetch(`${API_URL}/api/user-platforms/${user.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.selections && data.selections.length > 0) {
          // User has existing selections
          console.log("✅ Found existing user platform selections:", data.selections);
          const selected = data.selections
            .filter((up: UserPlatform) => up.is_selected)
            .map((up: UserPlatform) => up.platform_id);
          setSelectedPlatformIds(selected);
        } else {
          // New user OR existing user without platform selections
          console.log("ℹ️ No platform selections found. Creating default selections (all platforms)...");
          const allPlatformIds = platforms.map((p) => p.id);
          setSelectedPlatformIds(allPlatformIds);
          
          // Initialize all platforms as selected for this user
          try {
            const initResponse = await fetch(`${API_URL}/api/user-platforms/initialize`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user_id: user.id }),
            });
            
            if (initResponse.ok) {
              console.log("✅ Created default platform selections for user");
            }
          } catch (initError) {
            console.error("Error creating default platform selections:", initError);
          }
        }
        
        setLoaded(true);
      } catch (error) {
        console.error("Error loading user platforms:", error);
        setLoaded(true);
      }
    })();
  }, [user, platforms]);

  // Toggle platform selection via backend API
  const togglePlatform = useCallback(async (platformId: string) => {
    if (!user) return;

    setSelectedPlatformIds((prev) => {
      const isCurrentlySelected = prev.includes(platformId);
      const next = isCurrentlySelected
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId];

      // Update database via backend API
      (async () => {
        try {
          const response = await fetch(`${API_URL}/api/user-platforms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              platform_id: platformId,
              is_selected: !isCurrentlySelected,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("✅ Updated platform selection:", data);
        } catch (error) {
          console.error("Error updating platform selection:", error);
        }
      })();

      return next;
    });
  }, [user]);

  // Get selected platforms (full objects)
  const selectedPlatforms = platforms.filter((p) =>
    selectedPlatformIds.includes(p.id)
  );

  return {
    platforms,
    selectedPlatformIds,
    selectedPlatforms,
    togglePlatform,
    loaded,
  };
}

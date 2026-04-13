import { useState, useEffect } from "react";

type AuthUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as Record<string, unknown>;
            const id = typeof parsed.id === "string" ? parsed.id : "mock-id";
            const email = typeof parsed.email === "string" ? parsed.email : "user@example.com";
            setUser({ id, email });
          } catch {
            setUser({ id: "mock-id", email: "user@example.com" });
          }
        } else {
          setUser({ id: "mock-id", email: "user@example.com" });
        }
      } else {
        setUser(null);
      }
      setIsReady(true);
    };

    checkAuth();

    // Listen for storage changes (optional, helps with multiple tabs)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const signOut = async () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return { user, isReady, signOut };
}

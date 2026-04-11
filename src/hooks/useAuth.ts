import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        // TODO: In a real app, you would verify the token with your backend here
        // and fetch the actual user profile from your PostgreSQL 'users' table.
        setUser({ id: "mock-id", email: "user@example.com" });
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

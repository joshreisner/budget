import { useEffect, useState } from "react";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    // Clear the cookie by expiring it
    document.cookie =
      "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict";
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      const response = await fetch("/.netlify/functions/auth-verify", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { isAuthenticated, loading, logout, checkAuth };
};

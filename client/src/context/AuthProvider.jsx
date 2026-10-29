import { useEffect, useState } from "react";
import api from "../api.js";
import { AuthContext } from "./AuthContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        if (error.response?.status === 401) {
          setUser(null);
        } else {
          console.error("Unable to restore session:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  async function login(credentials) {
    const response = await api.post("/auth/login", credentials);

    setUser(response.data.user);

    return response.data.user;
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

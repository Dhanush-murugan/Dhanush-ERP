import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ds_erp_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("erp_token") || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      api
        .getMe()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem("ds_erp_user", JSON.stringify(res.user));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.user) {
        setUser(res.user);
        setToken(res.token);
        if (res.token) {
          localStorage.setItem("erp_token", res.token);
        }
        localStorage.setItem("ds_erp_user", JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error(res.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("erp_token");
    localStorage.removeItem("ds_erp_user");
  };

  const isAdmin = () => {
    const role = String(user?.role || "").toLowerCase();
    return role === "admin" || role === "super_admin" || role === "superadmin";
  };

  const isManager = () => {
    const role = String(user?.role || "").toLowerCase();
    return role === "admin" || role === "manager" || role === "hr";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isManager,
        isAuthenticated: !!user || !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

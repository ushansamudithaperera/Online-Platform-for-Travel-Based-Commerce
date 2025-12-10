import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

function normalizeRole(role) {
  if (!role) return null;
  return role.replace("ROLE_", "").toLowerCase();   // ❤️ KEY FIX
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (token && userJson) {
      const parsed = JSON.parse(userJson);

      // normalize role when loading
      parsed.role = normalizeRole(parsed.role);

      setUser(parsed);
    }

    setLoading(false);
  }, []);

  const login = (userObj, token) => {
    const normalizedUser = {
      ...userObj,
      role: normalizeRole(userObj.role),   // ❤️ KEY FIX
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

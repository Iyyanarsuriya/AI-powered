import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentStoredUser,
  getStoredToken,
} from "../api/Auth/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on app startup
  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const storedUser = getCurrentStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (err) {
      console.error("Failed to load stored auth session:", err);
      logoutUser();
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  // Register handler
  const register = async (userData) => {
    const data = await registerUser(userData);
    return data;
  };

  // Logout handler
  const logout = () => {
    logoutUser();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume AuthContext easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

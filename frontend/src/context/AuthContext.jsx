import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../services/api";

const AuthContext = createContext(null);
const FARMER_KEY = "km_farmer";

const readStoredFarmer = () => {
  try {
    const raw = localStorage.getItem(FARMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(readStoredFarmer);
  const [token, setTokenState] = useState(getToken);
  const [initializing, setInitializing] = useState(Boolean(getToken()));

  const persistFarmer = useCallback((value) => {
    setFarmer(value);
    if (value) localStorage.setItem(FARMER_KEY, JSON.stringify(value));
    else localStorage.removeItem(FARMER_KEY);
  }, []);

  const logout = useCallback(() => {
    try {
      if (getToken()) api.post("/auth/logout").catch(() => {});
    } catch {
      // Client-side logout is sufficient if the server is unreachable.
    }
    setToken(null);
    setTokenState(null);
    persistFarmer(null);
  }, [persistFarmer]);

  useEffect(() => {
    let active = true;
    if (!token) {
      setInitializing(false);
      return undefined;
    }
    setInitializing(true);
    api
      .get("/auth/me")
      .then((data) => {
        if (active) persistFarmer(data);
      })
      .catch(() => {
        if (active) {
          setToken(null);
          setTokenState(null);
          persistFarmer(null);
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [token, persistFarmer]);

  const applySession = useCallback(
    (data) => {
      setToken(data.access_token);
      setTokenState(data.access_token);
      persistFarmer(data.farmer);
      return data.farmer;
    },
    [persistFarmer]
  );

  const login = useCallback(
    async (credentials) => {
      const data = await api.post("/auth/login", credentials);
      return applySession(data);
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.post("/auth/register", payload);
      return applySession(data);
    },
    [applySession]
  );

  const updateFarmer = useCallback(
    (value) => {
      persistFarmer(value);
    },
    [persistFarmer]
  );

  const value = useMemo(
    () => ({
      farmer,
      token,
      isAuthenticated: Boolean(token && farmer),
      initializing,
      login,
      register,
      logout,
      updateFarmer,
    }),
    [farmer, token, initializing, login, register, logout, updateFarmer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

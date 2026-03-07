"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";

const AUTH_TOKEN_KEY = "pasc-auth-token";
const AUTH_USER_KEY = "pasc-auth-user";

export type PlayerMe = {
  _id: string;
  fullName: string;
  email: string;
  whatsApp: string;
  photo: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  dateOfBirth?: string;
  leagueRegistrations?: { league: { name: string; slug: string }; paymentStatus: string; eligible: boolean }[];
  status?: "pending" | "verified" | "rejected";
};

type AuthContextValue = {
  token: string | null;
  user: PlayerMe | null;
  loading: boolean;
  loginWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  setAuthFromPlayerRegister: (token: string, player: PlayerMe) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser(): PlayerMe | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as PlayerMe) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PlayerMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getStoredToken());
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = await apiFetch<PlayerMe>("/api/auth/me");
      setUser(me);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));
      }
    } catch {
      setToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem(AUTH_USER_KEY);
      }
    }
  }, []);

  const loginWithOtp = useCallback(async (email: string) => {
    await apiFetch("/api/auth/send-login-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const res = await apiFetch<{ token: string; player: PlayerMe }>("/api/auth/verify-login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.player));
    }
    setToken(res.token);
    setUser(res.player);
  }, []);

  const setAuthFromPlayerRegister = useCallback((newToken: string, player: PlayerMe) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(player));
    }
    setToken(newToken);
    setUser(player);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        loginWithOtp,
        verifyOtp,
        setAuthFromPlayerRegister,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AUTH_TOKEN_KEY };

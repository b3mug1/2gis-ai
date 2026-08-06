"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/api";
import { authService } from "@/services/authService";
import { queryClient } from "@/lib/queryClient";
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from "@/types/api";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from stored tokens
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthResponse = useCallback((data: AuthResponse) => {
    setTokens(data.tokens.access_token, data.tokens.refresh_token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      const res = await authService.login(data);
      handleAuthResponse(res);
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const res = await authService.register(data);
      handleAuthResponse(res);
    },
    [handleAuthResponse]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout({ refresh_token: refreshToken });
      } catch {
        // ignore errors on logout
      }
    }
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

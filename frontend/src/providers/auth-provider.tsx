"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getMeApi, loginApi, registerApi } from "@/lib/api/auth";
import { clearToken, getToken, getTokenExpiry, isTokenExpired, setToken } from "@/lib/api/token";
import { User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => {
    const token = getToken();
    return Boolean(token && !isTokenExpired(token));
  });

  useEffect(() => {
    const token = getToken();
    if (token && isTokenExpired(token)) {
      clearToken();
      setHasToken(false);
      return;
    }
    setHasToken(Boolean(token));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const timeout = window.setTimeout(() => {
      clearToken();
      setHasToken(false);
      queryClient.clear();
      toast.error("Session expired. Please sign in again.");
      router.replace("/login");
    }, Math.max(expiry - Date.now(), 0));

    return () => window.clearTimeout(timeout);
  }, [hasToken, queryClient, router]);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMeApi,
    enabled: hasToken
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isAuthenticated: Boolean(hasToken && user),
      isLoading: hasToken && isLoading,
      login: async (input) => {
        const result = await loginApi(input);
        setToken(result.token);
        setHasToken(true);
        queryClient.setQueryData(["auth", "me"], result.user);
        // Role-based redirect: admin → full dashboard, employee → simple store UI
        const destination = result.user.role === "ADMIN" ? "/dashboard" : "/store";
        router.replace(destination);
      },
      register: async (input) => {
        const result = await registerApi(input);
        setToken(result.token);
        setHasToken(true);
        queryClient.setQueryData(["auth", "me"], result.user);
        router.replace("/dashboard");
      },
      logout: () => {
        clearToken();
        setHasToken(false);
        queryClient.clear();
        router.replace("/login");
      }
    }),
    [hasToken, isLoading, queryClient, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

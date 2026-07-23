"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

export function useProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = pathname === "/login" || pathname === "/signup";

    // Redirect unauthenticated users away from protected pages to /login
    if (!isAuthenticated && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user) {
      // Redirect authenticated users away from auth pages to their main view
      if (isAuthRoute) {
        const destination = user.role === "ADMIN" ? "/dashboard" : "/store";
        router.replace(destination);
        return;
      }

      const isAdminRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/products") ||
        pathname.startsWith("/inventory") ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/routing") ||
        pathname.startsWith("/sales") ||
        pathname.startsWith("/purchases") ||
        pathname.startsWith("/reports") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/settings");

      // Employees trying to access admin routes → redirect to store
      if (isAdminRoute && user.role !== "ADMIN") {
        router.replace("/store");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  return { isAuthenticated, isLoading };
}

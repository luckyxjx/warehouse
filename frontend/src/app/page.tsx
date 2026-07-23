"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      const destination = user.role === "ADMIN" ? "/dashboard" : "/store";
      router.replace(destination);
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}

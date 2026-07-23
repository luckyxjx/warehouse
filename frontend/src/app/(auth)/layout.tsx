"use client";

import { ReactNode } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useProtectedRoute } from "@/hooks/use-protected-route";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useProtectedRoute();

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}

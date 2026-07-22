"use client";

import { ReactNode, useState } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import { Sidebar } from "./sidebar";
import { TopNavbar } from "./top-navbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, isLoading } = useProtectedRoute();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </div>
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-72 bg-card">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <TopNavbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

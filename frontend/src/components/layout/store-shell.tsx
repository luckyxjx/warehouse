"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { BarChart2, Home, Package, ShoppingCart } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const NAV = [
  { href: "/store", label: "Home", icon: Home },
  { href: "/store/sale", label: "Sell", icon: ShoppingCart },
  { href: "/store/stock", label: "Stock", icon: Package },
  { href: "/store/today", label: "Today", icon: BarChart2 }
];

export function StoreShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide">RetailOps Store</span>
        </div>
        <span className="text-xs text-slate-400">
          {user?.name ?? "Store"}
        </span>
      </header>

      {/* Page content — padded above bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-slate-800 bg-slate-900">
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-sky-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

import { StoreShell } from "@/components/layout/store-shell";

export default function RetailerLayout({ children }: { children: React.ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}

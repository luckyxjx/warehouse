import {
  BarChart3,
  Boxes,
  ClipboardList,
  Gauge,
  ListOrdered,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Products", href: "/products", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Orders", href: "/orders", icon: ListOrdered },
  { label: "Routing", href: "/routing", icon: Truck },
  { label: "Dispatch", href: "/sales", icon: ShoppingCart },
  { label: "Receiving", href: "/purchases", icon: Receipt },
  { label: "Reports", href: "/reports", icon: ClipboardList },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings }
];

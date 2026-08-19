import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Shapes,
  Shirt,
  Palette,
  Cpu,
  ClipboardList,
  Factory,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Designs", href: "/designs", icon: Shapes },
  { label: "Products", href: "/products", icon: Shirt },
  { label: "Thread Library", href: "/threads", icon: Palette },
  { label: "Machines", href: "/machines", icon: Cpu },
  { label: "Setups", href: "/setups", icon: ClipboardList },
  { label: "Production Queue", href: "/jobs", icon: Factory },
];

"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Box,
  ArrowRightLeft,
  CalendarClock,
  Wrench,
  ShieldCheck,
  LineChart,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast-provider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organization Setup", href: "/organization-setup", icon: Settings },
  { name: "Assets", href: "/assets", icon: Box },
  { name: "Allocation & Transfer", href: "/allocation", icon: ArrowRightLeft },
  { name: "Resource Booking", href: "/booking", icon: CalendarClock },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Audit", href: "/audit", icon: ShieldCheck },
  { name: "Reports", href: "/reports", icon: LineChart },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      // Force redirect even on error
      router.push("/login");
    }
  };

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-[60px] items-center gap-2.5 border-b border-gray-200 px-5">
        <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-sm">
          <span className="text-sm font-bold text-white">A</span>
        </div>
        <span className="text-[15px] font-bold tracking-tight text-gray-900">
          AssetFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-gray-400 group-hover:text-gray-600",
                )}
              />
              <span className="flex-1 leading-none">{item.name}</span>
              {isActive && (
                <ChevronRight className="text-primary h-3.5 w-3.5 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900">
              Admin User
            </p>
            <p className="truncate text-[10px] text-gray-400">
              admin@assetflow.io
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="hover:text-destructive flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

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
    <aside className="flex h-screen w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm">
      {/* Logo */}
      <Link
        href="/"
        className="flex h-[60px] items-center gap-2 border-b border-gray-200 px-5 transition-colors hover:bg-gray-50"
      >
        <img src="/logo.svg" alt="AssetFlow Logo" className="h-8 w-auto" />
        <span className="text-xl font-black tracking-tight text-gray-900">
          AssetFlow
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0 overflow-y-auto py-3">
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
                "group relative flex items-center gap-3 px-6 py-3.5 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {isActive && (
                <div className="bg-primary absolute top-0 bottom-0 left-0 w-1" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 group-hover:text-gray-700",
                )}
              />
              <span className="flex-1 leading-none">{item.name}</span>
              {isActive && (
                <ChevronRight className="text-primary h-4 w-4 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 bg-gray-50/50 p-3">
        <div className="flex items-center gap-2 border-2 border-gray-900 bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-primary flex h-8 w-8 items-center justify-center border border-gray-900 text-xs font-bold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">
              Admin User
            </p>
            <p className="truncate text-[10px] font-medium text-gray-500">
              admin@assetflow.io
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center border-2 border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-red-50 hover:text-red-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

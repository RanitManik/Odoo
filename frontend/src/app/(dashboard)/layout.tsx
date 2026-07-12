import React from "react";
import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-[60px] flex-shrink-0 items-center border-b border-gray-200 bg-white px-8">
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">Admin Console</span>
          </div>
        </header>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  );
}

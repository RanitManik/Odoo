"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Building2,
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/button";

interface Asset {
  id: string;
  name: string;
  assetTag: string;
  status: string;
  expectedReturnDate: string | null;
  user: { name: string } | null;
  department: { name: string } | null;
}

interface TransferRequest {
  id: string;
  status: string;
}

export default function DashboardPage() {
  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data;
    },
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets");
      return res.data;
    },
  });

  const { data: transfers = [], isLoading: transfersLoading } = useQuery<TransferRequest[]>({
    queryKey: ["transfers"],
    queryFn: async () => {
      const res = await api.get("/transfers");
      return res.data;
    },
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/bookings");
      return res.data;
    },
  });

  const isLoading = deptsLoading || assetsLoading || transfersLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
  }

  // --- Empty State ---
  if (!departments || departments.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <div className="bg-primary/10 mb-6 flex h-24 w-24 items-center justify-center rounded-full">
          <Building2 className="text-primary h-12 w-12" />
        </div>
        <h2 className="text-foreground mb-2 text-3xl font-bold tracking-tight">
          Welcome to AssetFlow!
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Let&apos;s get your workspace ready. Start by setting up your
          departments, categories, and employees to unlock the full power of the
          platform.
        </p>
        <Link href="/organization-setup">
          <Button size="lg" className="group">
            Go to Organization Setup
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate live statistics
  const availableCount = assets.filter((a) => a.status === "AVAILABLE").length;
  const allocatedCount = assets.filter((a) => a.status === "ALLOCATED").length;
  const pendingTransfersCount = transfers.filter((t) => t.status === "PENDING").length;
  const activeBookingsCount = bookings.filter((b) => b.status === "UPCOMING" || b.status === "ONGOING").length;

  const overdueAssets = assets.filter((a) => {
    if (a.status !== "ALLOCATED" || !a.expectedReturnDate) return false;
    return new Date(a.expectedReturnDate) < new Date();
  });

  // --- Normal Dashboard (Screen 2 Mockup) ---
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">
          Today&apos;s Overview
        </h2>
        <p className="text-muted-foreground mt-2">
          Here is what&apos;s happening across your organization today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <Box className="h-4 w-4" />
            <span>Available Assets</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">{availableCount}</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>Allocated Assets</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">{allocatedCount}</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4" />
            <span>Active Bookings</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">{activeBookingsCount}</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <ArrowRightLeft className="h-4 w-4" />
            <span>Pending Transfers</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">{pendingTransfersCount}</div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueAssets.length > 0 && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-4 rounded-xl border p-5">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">{overdueAssets.length} assets overdue for return</h4>
            <p className="text-sm opacity-90">
              These assets have passed their expected return date. Please follow up.
            </p>
          </div>
          <Link href="/allocation" className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              View Overdue
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link href="/assets">
          <Button className="font-semibold shadow-sm">+ Register Asset</Button>
        </Link>
        <Link href="/booking">
          <Button variant="outline" className="font-semibold shadow-sm">
            Book Resource
          </Button>
        </Link>
        <Link href="/maintenance">
          <Button variant="outline" className="font-semibold shadow-sm">
            Raise Request
          </Button>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="border-border bg-background rounded-xl border shadow-sm">
        <div className="border-border border-b p-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="p-0">
          <ul className="divide-border divide-y">
            {assets.slice(0, 3).map((asset) => {
              const holderName = asset.user?.name || asset.department?.name || "";
              return (
                <li key={asset.id} className="hover:bg-muted/50 flex items-start gap-4 p-6">
                  <div className={`mt-1 h-2 w-2 rounded-full ${asset.status === "ALLOCATED" ? "bg-primary" : "bg-success"}`}></div>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      Asset {asset.name} ({asset.assetTag}) - currently {asset.status.toLowerCase()}
                      {asset.status === "ALLOCATED" && holderName && ` to ${holderName}`}
                    </p>
                    <div className="text-muted-foreground mt-1 flex items-center text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Just updated
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

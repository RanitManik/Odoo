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

export default function DashboardPage() {
  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data;
    },
  });

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
          <div className="text-foreground mt-4 text-4xl font-bold">128</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>Allocated Assets</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">76</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4" />
            <span>Active Bookings</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">9</div>
        </div>

        <div className="border-border bg-background rounded-xl border p-6 shadow-sm transition-all hover:shadow-md">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm font-medium">
            <ArrowRightLeft className="h-4 w-4" />
            <span>Pending Transfers</span>
          </div>
          <div className="text-foreground mt-4 text-4xl font-bold">3</div>
        </div>
      </div>

      {/* Overdue Alert */}
      <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-4 rounded-xl border p-5">
        <AlertCircle className="h-6 w-6" />
        <div>
          <h4 className="text-sm font-bold">3 assets overdue for return</h4>
          <p className="text-sm opacity-90">
            These assets have been flagged for follow-up immediately.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive ml-auto hover:text-white"
        >
          View Overdue
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button className="font-semibold shadow-sm">+ Register Asset</Button>
        <Button variant="outline" className="font-semibold shadow-sm">
          Book Resource
        </Button>
        <Button variant="outline" className="font-semibold shadow-sm">
          Raise Request
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="border-border bg-background rounded-xl border shadow-sm">
        <div className="border-border border-b p-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="p-0">
          <ul className="divide-border divide-y">
            <li className="hover:bg-muted/50 flex items-start gap-4 p-6">
              <div className="bg-primary mt-1 h-2 w-2 rounded-full"></div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  Laptop AF-0114 - allocated to Priya Shah (IT Dept)
                </p>
                <div className="text-muted-foreground mt-1 flex items-center text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  10 mins ago
                </div>
              </div>
            </li>
            <li className="hover:bg-muted/50 flex items-start gap-4 p-6">
              <div className="bg-success mt-1 h-2 w-2 rounded-full"></div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  Room B2 - booking confirmed (2:00 to 3:00 PM)
                </p>
                <div className="text-muted-foreground mt-1 flex items-center text-xs">
                  <Clock className="mr-1 h-3 w-3" />1 hour ago
                </div>
              </div>
            </li>
            <li className="hover:bg-muted/50 flex items-start gap-4 p-6">
              <div className="bg-warning mt-1 h-2 w-2 rounded-full"></div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  Projector AF-0062 - maintenance resolved
                </p>
                <div className="text-muted-foreground mt-1 flex items-center text-xs">
                  <Clock className="mr-1 h-3 w-3" />2 hours ago
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

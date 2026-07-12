"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "@/lib/api";
import Button from "@/components/ui/button";
import { toast } from "@/components/ui/toast-provider";
import {
  Bell,
  Check,
  ClipboardList,
  Wrench,
  CalendarCheck,
  AlertCircle,
  Inbox,
  UserCheck,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Search,
  CheckCircle2,
} from "lucide-react";

// --- Types ---
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  assetId: string;
  action: string;
  details: string;
  createdAt: string;
  asset: {
    name: string;
    assetTag: string;
  };
  user: {
    name: string;
    email: string;
  } | null;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"notifications" | "activities">("notifications");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<
    Notification[]
  >({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
  });

  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useQuery<
    ActivityLog[]
  >({
    queryKey: ["activities"],
    queryFn: async () => {
      const res = await api.get("/notifications/activities");
      return res.data;
    },
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/notifications/read-all");
      return res.data;
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  // Filters
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredActivities = activities.filter((act) => {
    const term = searchQuery.toLowerCase();
    return (
      act.action.toLowerCase().includes(term) ||
      act.details.toLowerCase().includes(term) ||
      act.asset.name.toLowerCase().includes(term) ||
      act.asset.assetTag.toLowerCase().includes(term) ||
      (act.user && act.user.name.toLowerCase().includes(term))
    );
  });

  // Helper for notification icons and styling based on type
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "ASSET_ASSIGNED":
        return {
          icon: <UserCheck className="h-5 w-5 text-green-600" />,
          bgColor: "bg-green-50 border-green-150 text-green-700",
          badgeColor: "bg-green-100 text-green-800",
        };
      case "ASSET_RETURNED":
        return {
          icon: <Inbox className="h-5 w-5 text-blue-600" />,
          bgColor: "bg-blue-50 border-blue-150 text-blue-700",
          badgeColor: "bg-blue-100 text-blue-800",
        };
      case "MAINTENANCE_APPROVED":
      case "MAINTENANCE_REJECTED":
        return {
          icon: <Wrench className="h-5 w-5 text-orange-600" />,
          bgColor: "bg-orange-50 border-orange-150 text-orange-700",
          badgeColor: "bg-orange-100 text-orange-800",
        };
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
        return {
          icon: <CalendarCheck className="h-5 w-5 text-purple-600" />,
          bgColor: "bg-purple-50 border-purple-150 text-purple-700",
          badgeColor: "bg-purple-100 text-purple-800",
        };
      case "TRANSFER_APPROVED":
      case "TRANSFER_REJECTED":
        return {
          icon: <ArrowRightLeft className="h-5 w-5 text-cyan-600" />,
          bgColor: "bg-cyan-50 border-cyan-150 text-cyan-700",
          badgeColor: "bg-cyan-100 text-cyan-800",
        };
      case "AUDIT_DISCREPANCY":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          bgColor: "bg-red-50 border-red-150 text-red-700",
          badgeColor: "bg-red-100 text-red-800",
        };
      default:
        return {
          icon: <Bell className="h-5 w-5 text-gray-500" />,
          bgColor: "bg-gray-50 border-gray-150 text-gray-700",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  // Helper for activity log styling
  const getActivityConfig = (action: string) => {
    switch (action) {
      case "REGISTERED":
        return { color: "text-green-700 bg-green-50 border-green-200", label: "Registered" };
      case "ALLOCATED":
        return { color: "text-blue-700 bg-blue-50 border-blue-200", label: "Allocated" };
      case "RETURNED":
        return { color: "text-indigo-700 bg-indigo-50 border-indigo-200", label: "Returned" };
      case "BOOKED":
        return { color: "text-purple-700 bg-purple-50 border-purple-200", label: "Booked" };
      case "BOOKING_CANCELLED":
        return { color: "text-red-700 bg-red-50 border-red-200", label: "Booking Cancelled" };
      case "MAINTENANCE_APPROVED":
        return { color: "text-orange-700 bg-orange-50 border-orange-200", label: "Maintenance Approved" };
      case "MAINTENANCE_REJECTED":
        return { color: "text-red-700 bg-red-50 border-red-200", label: "Maintenance Rejected" };
      case "MAINTENANCE_RESOLVED":
        return { color: "text-green-700 bg-green-50 border-green-200", label: "Maintenance Resolved" };
      case "TRANSFERRED":
        return { color: "text-teal-700 bg-teal-50 border-teal-200", label: "Transferred" };
      case "TRANSFER_REJECTED":
        return { color: "text-red-700 bg-red-50 border-red-200", label: "Transfer Rejected" };
      case "AUDIT_SCHEDULED":
        return { color: "text-sky-700 bg-sky-50 border-sky-200", label: "Audit Scheduled" };
      case "AUDIT_STARTED":
        return { color: "text-amber-700 bg-amber-50 border-amber-200", label: "Audit Started" };
      case "AUDIT_DISCREPANCY_FOUND":
        return { color: "text-red-700 bg-red-50 border-red-200", label: "Audit Discrepancy" };
      case "AUDIT_DISCREPANCY_RESOLVED":
        return { color: "text-green-700 bg-green-50 border-green-200", label: "Audit Resolved" };
      default:
        return { color: "text-gray-700 bg-gray-50 border-gray-200", label: action };
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Title block matching standard vibe */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Notifications & Activities
          </h2>
          <p className="text-muted-foreground mt-2">
            Track real-time inventory lifecycle changes, system logs, and personalized asset approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "notifications" && unreadCount > 0 && (
            <Button
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === "notifications") refetchNotifications();
              else refetchActivities();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs - Standard bottom border design matching other views */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Bell className="h-4 w-4" />
          My Notifications
          {unreadCount > 0 && (
            <span className="ml-1 bg-red-100 text-red-600 rounded-none px-2 py-0.5 text-xs font-semibold">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "activities"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          System Activity Logs
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "notifications" ? (
        notificationsLoading ? (
          <div className="flex justify-center p-8">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-none border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-none bg-gray-50 text-gray-400">
              <Inbox className="h-7 w-7" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">Your inbox is clear</p>
            <p className="text-sm text-gray-500">
              Personalized asset updates, bookings, and alerts will appear here when active.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const config = getNotificationConfig(notif.type);
              return (
                  <div
                    key={notif.id}
                    className={`flex items-start justify-between p-4 bg-white rounded-none relative transition-colors ${
                      !notif.read ? "border-2 border-gray-900 border-l-[6px] border-l-primary" : "border border-gray-200"
                    }`}
                  >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-none border h-fit shrink-0 ${config.bgColor}`}>
                      {config.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h4 className={`text-sm font-bold ${!notif.read ? "text-gray-900" : "text-gray-700"}`}>
                          {notif.title}
                        </h4>
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide leading-none ${config.badgeColor}`}>
                          {notif.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(notif.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {!notif.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsReadMutation.mutate(notif.id)}
                      disabled={markAsReadMutation.isPending}
                      className="shrink-0 ml-4 font-semibold border border-gray-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100"
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Mark read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Timeline Activities tab */
        <div className="space-y-4">
          {/* Timeline search bar */}
          <div className="relative max-w-md bg-white rounded-none shadow-sm border border-gray-200">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search actions, asset tag, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-none py-2 pl-9 pr-4 text-sm text-gray-900 focus:outline-none"
            />
          </div>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-none border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-none bg-gray-50 text-gray-400">
                <ClipboardList className="h-7 w-7" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-900">No activity logs found</p>
              <p className="text-sm text-gray-500">
                All physical asset allocations, returns, and maintenance records will display here.
              </p>
            </div>
          ) : (
            /* Compact list matching rest of the dashboard styling */
            <div className="space-y-2">
              {filteredActivities.map((act) => {
                const config = getActivityConfig(act.action);
                return (
                  <div
                    key={act.id}
                    className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white border border-gray-200 rounded-none p-4"
                  >
                    <div className="flex flex-col md:w-1/4 gap-2 shrink-0">
                      <span
                        className={`rounded-none px-2 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit border border-gray-200 ${config.color}`}
                      >
                        {config.label.replace(/_/g, " ")}
                      </span>
                      <div className="flex flex-col mt-0.5">
                        <span className="font-black text-gray-900 text-sm leading-tight">{act.asset.name}</span>
                        <span className="font-mono text-xs font-bold text-gray-500 mt-0.5">{act.asset.assetTag}</span>
                      </div>
                    </div>

                    <div className="flex-1 text-sm text-gray-800 font-semibold leading-relaxed md:px-4 md:border-l-2 md:border-gray-200">
                      {act.details}
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 shrink-0 md:w-1/4">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600 font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(act.createdAt).toLocaleString()}</span>
                      </div>
                      {act.user && (
                        <div className="text-xs text-gray-900 font-black bg-white border border-gray-200 px-2 py-1 truncate max-w-full">
                          {act.user.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

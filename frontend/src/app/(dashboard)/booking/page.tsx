"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Table2 } from "@/components/ui/table";
import { toast } from "@/components/ui/toast-provider";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { CalendarClock, Plus, AlertCircle } from "lucide-react";

// --- Types ---
interface Asset {
  id: string;
  name: string;
  assetTag: string;
  isBookable: boolean;
  status: string;
}

interface Booking {
  id: string;
  assetId: string;
  asset: { name: string; assetTag: string };
  user: { name: string; email: string };
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
}

export default function BookingPage() {
  const queryClient = useQueryClient();
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isBookModalOpen, setBookModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {
      return;
    },
  });

  const [form, setForm] = useState({
    assetId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
  });

  // Queries
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets");
      return res.data;
    },
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", selectedAssetId],
    queryFn: async () => {
      const res = await api.get("/bookings", {
        params: selectedAssetId ? { assetId: selectedAssetId } : {},
      });
      return res.data;
    },
  });

  // Filter only bookable assets
  const bookableAssets = assets.filter((a) => a.isBookable);

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: async (payload: { assetId: string; startTime: string; endTime: string }) => {
      const res = await api.post("/bookings", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resource booked successfully");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setBookModalOpen(false);
    },
    onError: (err) => {
      toast.error(extractError(err));
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      toast.error(extractError(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct full ISO strings for startTime and endTime
    const startISO = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const endISO = new Date(`${form.date}T${form.endTime}:00`).toISOString();

    createBookingMutation.mutate({
      assetId: form.assetId,
      startTime: startISO,
      endTime: endISO,
    });
  };

  const assetOptions = bookableAssets.map((a) => ({
    label: `${a.name} (${a.assetTag})`,
    value: a.id,
  }));

  const filterAssetOptions = [
    { label: "All Shared Resources", value: "" },
    ...assetOptions,
  ];

  const columns = [
    {
      key: "asset",
      label: "Resource",
      formatValue: (_: any, row: Booking) => (
        <div>
          <div className="font-semibold text-gray-800">{row.asset.name}</div>
          <div className="font-mono text-xs text-gray-400">{row.asset.assetTag}</div>
        </div>
      ),
    },
    {
      key: "user",
      label: "Booked By",
      formatValue: (_: any, row: Booking) => (
        <div>
          <div className="font-medium text-gray-700">{row.user.name}</div>
          <div className="text-xs text-gray-400">{row.user.email}</div>
        </div>
      ),
    },
    {
      key: "time",
      label: "Time Slot",
      formatValue: (_: any, row: Booking) => {
        const start = new Date(row.startTime);
        const end = new Date(row.endTime);
        return (
          <div className="text-sm text-gray-600">
            <div className="font-medium">{start.toLocaleDateString()}</div>
            <div>
              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      formatValue: (_: any, row: Booking) => {
        const styles = {
          UPCOMING: "bg-blue-100 text-blue-800",
          ONGOING: "bg-green-100 text-green-800",
          COMPLETED: "bg-gray-100 text-gray-800",
          CANCELLED: "bg-red-100 text-red-800",
        }[row.status];
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
            {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      formatValue: (_: any, row: Booking) => {
        if (row.status === "CANCELLED" || row.status === "COMPLETED") {
          return <span className="text-gray-400 text-xs">—</span>;
        }
        return (
          <Button
            size="xs"
            variant="destructive"
            onClick={() =>
              setConfirmState({
                isOpen: true,
                title: "Cancel Booking",
                description: `Are you sure you want to cancel the booking for "${row.asset.name}" on ${new Date(
                  row.startTime
                ).toLocaleDateString()}?`,
                action: () => cancelBookingMutation.mutate(row.id),
              })
            }
          >
            Cancel
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Resource Booking
          </h2>
          <p className="text-muted-foreground mt-2">
            Book shared workspaces, meeting rooms, or equipment without schedules overlapping.
          </p>
        </div>
        <Button onClick={() => setBookModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Resource
        </Button>
      </div>

      {/* Asset Filter Bar */}
      <div className="flex items-center gap-4 ">
        <div className="w-72">
          <Select
            options={filterAssetOptions}
            selectedOption={
              filterAssetOptions.find((o) => o.value === selectedAssetId) ?? (null as any)
            }
            onChange={(val: any) => setSelectedAssetId(val?.value || "")}
          />
        </div>
        <span className="text-xs text-gray-400">
          Select a specific resource above to filter the timeline view.
        </span>
      </div>

      {/* Bookings List */}
      {bookingsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <CalendarClock className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">No active bookings found</p>
          <p className="text-sm text-gray-500 mb-5">
            Book a shared resource using the button above to reserve a slot.
          </p>
          <Button size="sm" onClick={() => setBookModalOpen(true)}>
            Book Resource
          </Button>
        </div>
      ) : (
        <Table2
          tableId="bookings-table"
          initialColumns={columns}
          data={bookings}
          currentPage={0}
          pagination={false}
          showFooter={false}
        />
      )}

      {/* --- BOOKING MODAL --- */}
      <Modal isOpen={isBookModalOpen} onClose={() => setBookModalOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title="Book Shared Resource" />
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            {assetOptions.length === 0 ? (
              <div className="flex w-full items-start gap-2 border border-yellow-500 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-yellow-600 mt-0.5" />
                <span>
                  No shared resources available. Go to the{" "}
                  <a href="/assets" className="underline font-bold">
                    Assets Directory
                  </a>{" "}
                  and toggle &ldquo;Bookable&rdquo; on for some assets.
                </span>
              </div>
            ) : (
              <Select
                label="Select Resource"
                options={assetOptions}
                selectedOption={
                  assetOptions.find((o) => o.value === form.assetId) ?? (null as any)
                }
                onChange={(val: any) => setForm({ ...form, assetId: val?.value || "" })}
                required
              />
            )}
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={createBookingMutation.isPending}>
              {createBookingMutation.isPending ? "Reserving..." : "Confirm Booking"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        title={confirmState.title}
        description={confirmState.description}
        isOpen={confirmState.isOpen}
        onOpenChange={(isOpen) => setConfirmState({ ...confirmState, isOpen })}
        action={() => {
          confirmState.action();
          setConfirmState({ ...confirmState, isOpen: false });
        }}
      />
    </div>
  );
}

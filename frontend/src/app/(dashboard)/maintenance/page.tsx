"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
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
import { Wrench, Plus, Clock } from "lucide-react";

// --- Types ---
interface Asset {
  id: string;
  name: string;
  assetTag: string;
  status: string;
}

interface MaintenanceRequest {
  id: string;
  assetId: string;
  asset: { id: string; name: string; assetTag: string; status: string };
  user: { id: string; name: string; email: string };
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
  technician: string | null;
  photo: string | null;
  createdAt: string;
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");

  // Modals state
  const [isRaiseOpen, setRaiseOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Forms state
  const [raiseForm, setRaiseForm] = useState({
    assetId: "",
    description: "",
    priority: "MEDIUM" as const,
  });

  const [assignForm, setAssignForm] = useState({
    technician: "",
  });

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

  // Queries
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets");
      return res.data;
    },
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      const res = await api.get("/maintenance");
      return res.data;
    },
  });

  // Mutations
  const raiseRequestMutation = useMutation({
    mutationFn: async (payload: typeof raiseForm) => {
      const res = await api.post("/maintenance", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Maintenance request raised");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setRaiseOpen(false);
      setRaiseForm({ assetId: "", description: "", priority: "MEDIUM" });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/maintenance/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request approved and routed to Under Maintenance");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/maintenance/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const assignTechMutation = useMutation({
    mutationFn: async (payload: { id: string; technician: string }) => {
      const res = await api.post(`/maintenance/${payload.id}/assign`, {
        technician: payload.technician,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Technician assigned");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      setAssignOpen(false);
      setSelectedRequest(null);
      setAssignForm({ technician: "" });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const startMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/maintenance/${id}/start`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Repair work started");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/maintenance/${id}/resolve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Repair work completed! Asset is back to Available.");
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  // Options
  const assetOptions = assets.map((a) => ({
    label: `${a.name} (${a.assetTag})`,
    value: a.id,
  }));

  const priorityOptions = [
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
    { label: "Urgent", value: "URGENT" },
  ];

  // Columns
  const activeRequests = requests.filter((r) => r.status !== "RESOLVED" && r.status !== "REJECTED");
  const resolvedRequests = requests.filter((r) => r.status === "RESOLVED" || r.status === "REJECTED");

  const priorityStyles = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    PENDING: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    TECHNICIAN_ASSIGNED: "Technician Assigned",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
  };

  const columns = [
    {
      key: "asset",
      label: "Asset",
      formatValue: (_: any, row: MaintenanceRequest) => (
        <div>
          <div className="font-semibold text-gray-800">{row.asset.name}</div>
          <div className="font-mono text-xs text-gray-400">{row.asset.assetTag}</div>
        </div>
      ),
    },
    { key: "description", label: "Issue / Description" },
    {
      key: "priority",
      label: "Priority",
      formatValue: (_: any, row: MaintenanceRequest) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[row.priority]}`}>
          {row.priority}
        </span>
      ),
    },
    {
      key: "status",
      label: "Workflow Status",
      formatValue: (_: any, row: MaintenanceRequest) => (
        <div>
          <span className="text-sm font-medium text-gray-800">{statusLabels[row.status]}</span>
          {row.technician && (
            <div className="text-xs text-gray-400">Tech: {row.technician}</div>
          )}
        </div>
      ),
    },
    {
      key: "raisedBy",
      label: "Raised By",
      formatValue: (_: any, row: MaintenanceRequest) => (
        <div>
          <div className="text-sm font-medium text-gray-700">{row.user.name}</div>
          <div className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Approve Request",
          handleAction: (row: MaintenanceRequest) => {
            if (row.status !== "PENDING") return;
            setConfirmState({
              isOpen: true,
              title: "Approve Maintenance",
              description: `Are you sure you want to approve repair work for "${row.asset.name}"? This flips the asset status to Under Maintenance.`,
              action: () => approveMutation.mutate(row.id),
            });
          },
        },
        {
          option: "Reject Request",
          handleAction: (row: MaintenanceRequest) => {
            if (row.status !== "PENDING") return;
            setConfirmState({
              isOpen: true,
              title: "Reject Request",
              description: `Are you sure you want to reject this request for "${row.asset.name}"?`,
              action: () => rejectMutation.mutate(row.id),
            });
          },
        },
        {
          option: "Assign Technician",
          handleAction: (row: MaintenanceRequest) => {
            if (row.status !== "APPROVED" && row.status !== "TECHNICIAN_ASSIGNED") return;
            setSelectedRequest(row);
            setAssignOpen(true);
          },
        },
        {
          option: "Start Work",
          handleAction: (row: MaintenanceRequest) => {
            if (row.status !== "TECHNICIAN_ASSIGNED") return;
            startMutation.mutate(row.id);
          },
        },
        {
          option: "Resolve Request",
          handleAction: (row: MaintenanceRequest) => {
            if (row.status !== "IN_PROGRESS") return;
            setConfirmState({
              isOpen: true,
              title: "Mark Resolved",
              description: `Has the issue with "${row.asset.name}" been fully resolved? Fips asset back to Available.`,
              action: () => resolveMutation.mutate(row.id),
            });
          },
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Maintenance Management
          </h2>
          <p className="text-muted-foreground mt-2">
            Route asset repair requests through approvals, technician dispatch, and workflow status logs.
          </p>
        </div>
        <Button onClick={() => setRaiseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Raise Request
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Active Requests
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {activeRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          Resolved & History
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {resolvedRequests.length}
          </span>
        </button>
      </div>

      {/* Tables list */}
      {requestsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : activeTab === "requests" ? (
        activeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Wrench className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">No active maintenance requests</p>
            <p className="text-sm text-gray-500 mb-5">
              All active requests requiring approval or currently under repair will appear here.
            </p>
            <Button size="sm" onClick={() => setRaiseOpen(true)}>
              Raise Request
            </Button>
          </div>
        ) : (
          <Table2
            tableId="active-maintenance-table"
            initialColumns={columns}
            data={activeRequests}
            currentPage={0}
            pagination={false}
            showFooter={false}
          />
        )
      ) : resolvedRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">No resolved requests found</p>
          <p className="text-sm text-gray-500">
            Completed repair requests and logs will be cataloged here.
          </p>
        </div>
      ) : (
        <Table2
          tableId="resolved-maintenance-table"
          initialColumns={columns}
          data={resolvedRequests}
          currentPage={0}
          pagination={false}
          showFooter={false}
        />
      )}

      {/* --- RAISE REQUEST MODAL --- */}
      <Modal isOpen={isRaiseOpen} onClose={() => setRaiseOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title="Raise Maintenance Request" />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            raiseRequestMutation.mutate(raiseForm);
          }}
        >
          <ModalBody className="space-y-4">
            <Select
              label="Select Asset"
              options={assetOptions}
              selectedOption={
                assetOptions.find((o) => o.value === raiseForm.assetId) ?? (null as any)
              }
              onChange={(val: any) => setRaiseForm({ ...raiseForm, assetId: val?.value || "" })}
              required
            />
            <Select
              label="Priority"
              options={priorityOptions}
              selectedOption={
                priorityOptions.find((o) => o.value === raiseForm.priority) ?? priorityOptions[1]
              }
              onChange={(val: any) =>
                setRaiseForm({ ...raiseForm, priority: (val?.value as any) || "MEDIUM" })
              }
              required
            />
            <Textarea
              label="Description of Issue"
              placeholder="E.g., Screen flickers when adjusting angle"
              value={raiseForm.description}
              onChange={(e) => setRaiseForm({ ...raiseForm, description: e.target.value })}
              required
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={raiseRequestMutation.isPending}>
              {raiseRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* --- ASSIGN TECH MODAL --- */}
      <Modal isOpen={isAssignOpen} onClose={() => setAssignOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title="Assign Technician" />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedRequest) {
              assignTechMutation.mutate({
                id: selectedRequest.id,
                technician: assignForm.technician,
              });
            }
          }}
        >
          <ModalBody className="space-y-4">
            <Input
              label="Technician Name"
              placeholder="E.g., John Doe"
              value={assignForm.technician}
              onChange={(e) => setAssignForm({ technician: e.target.value })}
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={assignTechMutation.isPending}>
              {assignTechMutation.isPending ? "Assigning..." : "Assign Tech"}
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

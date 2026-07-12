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
import { ArrowRightLeft, User, Building2, Plus, Calendar } from "lucide-react";

// --- Types ---
interface Asset {
  id: string;
  name: string;
  assetTag: string;
  status: "AVAILABLE" | "ALLOCATED" | "RESERVED" | "UNDER_MAINTENANCE" | "LOST" | "RETIRED" | "DISPOSED";
  condition: string;
  expectedReturnDate: string | null;
  user: { id: string; name: string; email: string } | null;
  department: { id: string; name: string } | null;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface TransferRequest {
  id: string;
  assetId: string;
  asset: { id: string; name: string; assetTag: string; status: string };
  requestor: { id: string; name: string; email: string };
  targetUser: { id: string; name: string; email: string } | null;
  targetDept: { id: string; name: string } | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function AllocationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"allocations" | "transfers">("allocations");

  // Modals state
  const [isAllocateOpen, setAllocateOpen] = useState(false);
  const [isReturnOpen, setReturnOpen] = useState(false);
  const [isTransferOpen, setTransferOpen] = useState(false);
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

  // Selected items
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Forms state
  const [allocateForm, setAllocateForm] = useState({
    assetId: "",
    targetType: "employee", // "employee" | "department"
    userId: "",
    departmentId: "",
    expectedReturnDate: "",
  });

  const [returnForm, setReturnForm] = useState({
    condition: "GOOD",
    notes: "",
  });

  const [transferForm, setTransferForm] = useState({
    targetType: "employee",
    userId: "",
    departmentId: "",
  });

  // Queries
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets");
      return res.data;
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
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

  // Mutations
  const allocateMutation = useMutation({
    mutationFn: async (payload: {
      assetId: string;
      userId?: string | null;
      departmentId?: string | null;
      expectedReturnDate?: string | null;
    }) => {
      const res = await api.post(`/assets/${payload.assetId}/allocate`, {
        userId: payload.userId,
        departmentId: payload.departmentId,
        expectedReturnDate: payload.expectedReturnDate,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset allocated successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setAllocateOpen(false);
      resetAllocateForm();
    },
    onError: (err: any) => {
      const errorMsg = extractError(err);
      toast.error(errorMsg);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (payload: { assetId: string; condition: string; notes?: string }) => {
      const res = await api.post(`/assets/${payload.assetId}/return`, {
        condition: payload.condition,
        notes: payload.notes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset returned successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setReturnOpen(false);
      setSelectedAsset(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const transferRequestMutation = useMutation({
    mutationFn: async (payload: {
      assetId: string;
      targetUserId?: string | null;
      targetDeptId?: string | null;
    }) => {
      const res = await api.post(`/assets/${payload.assetId}/transfer-request`, {
        targetUserId: payload.targetUserId,
        targetDeptId: payload.targetDeptId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer request submitted");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      setTransferOpen(false);
      setSelectedAsset(null);
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const approveTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/transfers/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer request approved");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/transfers/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer request rejected");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  // Helpers
  const resetAllocateForm = () => {
    setAllocateForm({
      assetId: "",
      targetType: "employee",
      userId: "",
      departmentId: "",
      expectedReturnDate: "",
    });
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === allocateForm.assetId);

    // Conflict Check Rule: If already allocated, block & prompt Transfer
    if (asset && asset.status === "ALLOCATED") {
      setSelectedAsset(asset);
      const currentlyHeldBy = asset.user?.name || asset.department?.name || "another user/department";
      toast.error(`Asset is currently held by ${currentlyHeldBy}. Initiate a transfer request instead.`);
      setAllocateOpen(false);
      setTransferOpen(true);
      setTransferForm({
        targetType: allocateForm.targetType,
        userId: allocateForm.userId,
        departmentId: allocateForm.departmentId,
      });
      return;
    }

    allocateMutation.mutate({
      assetId: allocateForm.assetId,
      userId: allocateForm.targetType === "employee" ? allocateForm.userId : null,
      departmentId: allocateForm.targetType === "department" ? allocateForm.departmentId : null,
      expectedReturnDate: allocateForm.expectedReturnDate || null,
    });
  };

  // Dropdown options
  const availableAssetOptions = assets
    .filter((a) => a.status === "AVAILABLE" || a.status === "ALLOCATED")
    .map((a) => ({
      label: `${a.name} (${a.assetTag}) - ${a.status.toLowerCase()}`,
      value: a.id,
    }));

  const employeeOptions = employees.map((e) => ({
    label: `${e.name} (${e.email})`,
    value: e.id,
  }));

  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d.id,
  }));

  const conditionOptions = [
    { label: "New", value: "NEW" },
    { label: "Good", value: "GOOD" },
    { label: "Fair", value: "FAIR" },
    { label: "Poor", value: "POOR" },
    { label: "Damaged", value: "DAMAGED" },
  ];

  // Table columns
  const allocationColumns = [
    {
      key: "assetTag",
      label: "Asset Tag",
      formatValue: (_: any, row: Asset) => (
        <span className="font-mono font-semibold text-gray-700">{row.assetTag}</span>
      ),
    },
    { key: "name", label: "Asset Name" },
    {
      key: "holder",
      label: "Currently Held By",
      formatValue: (_: any, row: Asset) => {
        if (row.user) {
          return (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-800">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {row.user.name}
            </span>
          );
        }
        if (row.department) {
          return (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-800">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              {row.department.name}
            </span>
          );
        }
        return <span className="text-gray-400">—</span>;
      },
    },
    {
      key: "expectedReturnDate",
      label: "Due Date",
      formatValue: (_: any, row: Asset) => {
        if (!row.expectedReturnDate) return <span className="text-gray-400">No Limit</span>;
        const date = new Date(row.expectedReturnDate);
        const isOverdue = date < new Date();
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isOverdue ? "text-red-600 font-bold" : "text-gray-600"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {date.toLocaleDateString()}
            {isOverdue && " (Overdue)"}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Return",
          handleAction: (row: Asset) => {
            setSelectedAsset(row);
            setReturnOpen(true);
          },
        },
        {
          option: "Transfer Request",
          handleAction: (row: Asset) => {
            setSelectedAsset(row);
            setTransferForm({
              targetType: "employee",
              userId: "",
              departmentId: "",
            });
            setTransferOpen(true);
          },
        },
      ],
    },
  ];

  const transferColumns = [
    {
      key: "asset",
      label: "Asset",
      formatValue: (_: any, row: TransferRequest) => (
        <div>
          <div className="font-semibold text-gray-850">{row.asset.name}</div>
          <div className="font-mono text-xs text-gray-450">{row.asset.assetTag}</div>
        </div>
      ),
    },
    {
      key: "requestor",
      label: "Requested By",
      formatValue: (_: any, row: TransferRequest) => (
        <span>{row.requestor.name}</span>
      ),
    },
    {
      key: "target",
      label: "Transfer To",
      formatValue: (_: any, row: TransferRequest) => {
        if (row.targetUser) {
          return (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {row.targetUser.name}
            </span>
          );
        }
        if (row.targetDept) {
          return (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              {row.targetDept.name}
            </span>
          );
        }
        return <span className="text-gray-400">—</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      formatValue: (_: any, row: TransferRequest) => {
        const styles = {
          PENDING: "bg-yellow-100 text-yellow-800",
          APPROVED: "bg-green-100 text-green-800",
          REJECTED: "bg-red-100 text-red-800",
        }[row.status];
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Approve",
          handleAction: (row: TransferRequest) => {
            setConfirmState({
              isOpen: true,
              title: "Approve Transfer",
              description: `Are you sure you want to approve the transfer of "${row.asset.name}" (${row.asset.assetTag})?`,
              action: () => approveTransferMutation.mutate(row.id),
            });
          },
        },
        {
          option: "Reject",
          handleAction: (row: TransferRequest) => {
            setConfirmState({
              isOpen: true,
              title: "Reject Transfer Request",
              description: `Are you sure you want to reject the transfer request for "${row.asset.name}" (${row.asset.assetTag})?`,
              action: () => rejectTransferMutation.mutate(row.id),
            });
          },
        },
      ],
    },
  ];

  const allocatedAssets = assets.filter((a) => a.status === "ALLOCATED");

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Asset Allocation & Transfer
          </h2>
          <p className="text-muted-foreground mt-2">
            Manage allocations, expected return policies, and department/employee transfers.
          </p>
        </div>
        <Button onClick={() => setAllocateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Allocate Asset
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("allocations")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "allocations"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <User className="h-4 w-4" />
          Active Allocations
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {allocatedAssets.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "transfers"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transfer Requests
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {transfers.filter((t) => t.status === "PENDING").length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "allocations" ? (
        assetsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : allocatedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Building2 className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">No active allocations</p>
            <p className="mb-5 text-sm text-gray-500">
              Allocate assets to departments or employees to start tracking.
            </p>
            <Button size="sm" onClick={() => setAllocateOpen(true)}>
              Allocate Asset
            </Button>
          </div>
        ) : (
          <Table2
            tableId="allocations-table"
            initialColumns={allocationColumns}
            data={allocatedAssets}
            currentPage={0}
            pagination={false}
            showFooter={false}
          />
        )
      ) : transfersLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ArrowRightLeft className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">No transfer requests</p>
          <p className="text-sm text-gray-500">
            All requests to transfer allocated assets between employees will appear here.
          </p>
        </div>
      ) : (
        <Table2
          tableId="transfers-table"
          initialColumns={transferColumns}
          data={transfers}
          currentPage={0}
          pagination={false}
          showFooter={false}
        />
      )}

      {/* --- ALLOCATE MODAL --- */}
      <Modal isOpen={isAllocateOpen} onClose={() => setAllocateOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title="Allocate Asset" />
        </ModalHeader>
        <form onSubmit={handleAllocateSubmit}>
          <ModalBody className="space-y-4">
            <Select
              label="Select Asset"
              options={availableAssetOptions}
              selectedOption={
                availableAssetOptions.find((o) => o.value === allocateForm.assetId) ?? (null as any)
              }
              onChange={(val: any) =>
                setAllocateForm({ ...allocateForm, assetId: val?.value || "" })
              }
              required
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Allocate To
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="targetType"
                    checked={allocateForm.targetType === "employee"}
                    onChange={() => setAllocateForm({ ...allocateForm, targetType: "employee" })}
                  />
                  Employee
                </label>
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="targetType"
                    checked={allocateForm.targetType === "department"}
                    onChange={() => setAllocateForm({ ...allocateForm, targetType: "department" })}
                  />
                  Department
                </label>
              </div>
            </div>

            {allocateForm.targetType === "employee" ? (
              <Select
                label="Select Employee"
                options={employeeOptions}
                selectedOption={
                  employeeOptions.find((o) => o.value === allocateForm.userId) ?? (null as any)
                }
                onChange={(val: any) =>
                  setAllocateForm({ ...allocateForm, userId: val?.value || "" })
                }
                required
              />
            ) : (
              <Select
                label="Select Department"
                options={departmentOptions}
                selectedOption={
                  departmentOptions.find((o) => o.value === allocateForm.departmentId) ?? (null as any)
                }
                onChange={(val: any) =>
                  setAllocateForm({ ...allocateForm, departmentId: val?.value || "" })
                }
                required
              />
            )}

            <Input
              label="Expected Return Date (Optional)"
              type="date"
              value={allocateForm.expectedReturnDate}
              onChange={(e) =>
                setAllocateForm({ ...allocateForm, expectedReturnDate: e.target.value })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={allocateMutation.isPending}>
              {allocateMutation.isPending ? "Allocating..." : "Allocate Asset"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* --- RETURN MODAL --- */}
      <Modal isOpen={isReturnOpen} onClose={() => setReturnOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title={`Return ${selectedAsset?.name || "Asset"}`} />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedAsset) {
              returnMutation.mutate({
                assetId: selectedAsset.id,
                condition: returnForm.condition,
                notes: returnForm.notes,
              });
            }
          }}
        >
          <ModalBody className="space-y-4">
            <Select
              label="Check-in Condition"
              options={conditionOptions}
              selectedOption={
                conditionOptions.find((o) => o.value === returnForm.condition) ?? (null as any)
              }
              onChange={(val: any) =>
                setReturnForm({ ...returnForm, condition: val?.value || "GOOD" })
              }
              required
            />
            <Input
              label="Check-in Notes"
              placeholder="E.g., Minor cosmetic scratches on the back"
              value={returnForm.notes}
              onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={returnMutation.isPending}>
              {returnMutation.isPending ? "Processing..." : "Complete Return"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* --- TRANSFER MODAL --- */}
      <Modal isOpen={isTransferOpen} onClose={() => setTransferOpen(false)} width="sm">
        <ModalHeader>
          <ModalTitle title={`Request Transfer for ${selectedAsset?.name || "Asset"}`} />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedAsset) {
              transferRequestMutation.mutate({
                assetId: selectedAsset.id,
                targetUserId: transferForm.targetType === "employee" ? transferForm.userId : null,
                targetDeptId: transferForm.targetType === "department" ? transferForm.departmentId : null,
              });
            }
          }}
        >
          <ModalBody className="space-y-4">
            <p className="text-sm text-gray-500">
              This asset is currently allocated to{" "}
              <strong className="text-gray-900">
                {selectedAsset?.user?.name || selectedAsset?.department?.name || "another owner"}
              </strong>
              . Submitting this request will alert administrators/managers for approval.
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Transfer To
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="transferTargetType"
                    checked={transferForm.targetType === "employee"}
                    onChange={() => setTransferForm({ ...transferForm, targetType: "employee" })}
                  />
                  Employee
                </label>
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <input
                    type="radio"
                    name="transferTargetType"
                    checked={transferForm.targetType === "department"}
                    onChange={() => setTransferForm({ ...transferForm, targetType: "department" })}
                  />
                  Department
                </label>
              </div>
            </div>

            {transferForm.targetType === "employee" ? (
              <Select
                label="Select Employee"
                options={employeeOptions}
                selectedOption={
                  employeeOptions.find((o) => o.value === transferForm.userId) ?? (null as any)
                }
                onChange={(val: any) =>
                  setTransferForm({ ...transferForm, userId: val?.value || "" })
                }
                required
              />
            ) : (
              <Select
                label="Select Department"
                options={departmentOptions}
                selectedOption={
                  departmentOptions.find((o) => o.value === transferForm.departmentId) ?? (null as any)
                }
                onChange={(val: any) =>
                  setTransferForm({ ...transferForm, departmentId: val?.value || "" })
                }
                required
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={transferRequestMutation.isPending}>
              {transferRequestMutation.isPending ? "Submitting..." : "Submit Transfer Request"}
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

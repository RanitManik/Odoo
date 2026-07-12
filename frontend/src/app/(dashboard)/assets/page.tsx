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
import DeleteConfirmationModal from "@/components/ui/delete-confirmation-modal";
import { Box, Plus, Search, X, Tag, BookOpen } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface AssetCategory {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Asset {
  id: string;
  name: string;
  assetTag: string;
  serialNumber: string | null;
  acquisitionDate: string;
  acquisitionCost: number | null;
  condition: "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
  location: string | null;
  isBookable: boolean;
  status:
    | "AVAILABLE"
    | "ALLOCATED"
    | "RESERVED"
    | "UNDER_MAINTENANCE"
    | "LOST"
    | "RETIRED"
    | "DISPOSED";
  categoryId: string;
  category: { id: string; name: string } | null;
  departmentId: string | null;
  department: { id: string; name: string } | null;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Allocated", value: "ALLOCATED" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Under Maintenance", value: "UNDER_MAINTENANCE" },
  { label: "Lost", value: "LOST" },
  { label: "Retired", value: "RETIRED" },
  { label: "Disposed", value: "DISPOSED" },
];

const CONDITION_OPTIONS = [
  { label: "New", value: "NEW" },
  { label: "Good", value: "GOOD" },
  { label: "Fair", value: "FAIR" },
  { label: "Poor", value: "POOR" },
  { label: "Damaged", value: "DAMAGED" },
];

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  ALLOCATED: "bg-blue-100 text-blue-700",
  RESERVED: "bg-purple-100 text-purple-700",
  UNDER_MAINTENANCE: "bg-yellow-100 text-yellow-700",
  LOST: "bg-red-100 text-red-700",
  RETIRED: "bg-gray-100 text-gray-600",
  DISPOSED: "bg-gray-100 text-gray-500",
};

const CONDITION_STYLES: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-green-100 text-green-700",
  FAIR: "bg-yellow-100 text-yellow-700",
  POOR: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Maintenance",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Box className="h-7 w-7 text-gray-400" />
      </div>
      <p className="mb-1 text-sm font-medium text-gray-900">No assets yet</p>
      <p className="mb-5 text-sm text-gray-500">
        Register your first asset to start tracking your inventory.
      </p>
      <Button size="sm" onClick={onAdd}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Register Asset
      </Button>
    </div>
  );
}

// ─── Asset Modal ─────────────────────────────────────────────────────────────
function AssetModal({
  isOpen,
  onClose,
  editingAsset,
  categories,
  departments,
  employees,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingAsset: Asset | null;
  categories: AssetCategory[];
  departments: Department[];
  employees: Employee[];
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editingAsset;

  type FormState = {
    name: string;
    serialNumber: string;
    acquisitionDate: string;
    acquisitionCost: string;
    condition: "NEW" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";
    location: string;
    isBookable: boolean;
    status:
      | "AVAILABLE"
      | "ALLOCATED"
      | "RESERVED"
      | "UNDER_MAINTENANCE"
      | "LOST"
      | "RETIRED"
      | "DISPOSED";
    categoryId: string;
    departmentId: string;
    userId: string;
  };

  const defaultForm: FormState = {
    name: "",
    serialNumber: "",
    acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionCost: "",
    condition: "GOOD",
    location: "",
    isBookable: false,
    status: "AVAILABLE",
    categoryId: "",
    departmentId: "",
    userId: "",
  };

  const [form, setForm] = useState(defaultForm);

  React.useEffect(() => {
    if (isOpen) {
      if (editingAsset) {
        setForm({
          name: editingAsset.name || "",
          serialNumber: editingAsset.serialNumber || "",
          acquisitionDate: editingAsset.acquisitionDate
            ? editingAsset.acquisitionDate.split("T")[0]
            : new Date().toISOString().split("T")[0],
          acquisitionCost:
            editingAsset.acquisitionCost != null
              ? String(editingAsset.acquisitionCost)
              : "",
          condition: editingAsset.condition,
          location: editingAsset.location || "",
          isBookable: editingAsset.isBookable,
          status: editingAsset.status,
          categoryId: editingAsset.categoryId || "",
          departmentId: editingAsset.departmentId || "",
          userId: editingAsset.userId || "",
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [isOpen, editingAsset]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        acquisitionCost: data.acquisitionCost
          ? parseFloat(data.acquisitionCost)
          : null,
        serialNumber: data.serialNumber || null,
        location: data.location || null,
        departmentId: data.departmentId || null,
        userId: data.userId || null,
      };
      if (isEdit) {
        const res = await api.patch(`/assets/${editingAsset!.id}`, payload);
        return res.data;
      }
      const res = await api.post("/assets", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Asset updated!" : "Asset registered!");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));
  const departmentOptions = departments.map((d) => ({
    label: d.name,
    value: d.id,
  }));
  const employeeOptions = employees.map((e) => ({
    label: `${e.name} (${e.email})`,
    value: e.id,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="md">
      <ModalHeader>
        <ModalTitle title={isEdit ? "Edit Asset" : "Register New Asset"} />
      </ModalHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <ModalBody className="space-y-4 pb-2">
          {/* Row 1: Name + Category */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Asset Name"
              placeholder="e.g. MacBook Pro 14"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Category"
              placeholder="Select category..."
              options={categoryOptions}
              selectedOption={
                categoryOptions.find((o) => o.value === form.categoryId) ??
                (null as any)
              }
              onChange={(val: any) =>
                setForm({ ...form, categoryId: val?.value || "" })
              }
              required
            />
          </div>

          {/* Row 2: Serial Number + Location */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Serial Number (Optional)"
              placeholder="e.g. SN-2024-001"
              value={form.serialNumber}
              onChange={(e) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
            />
            <Input
              label="Location (Optional)"
              placeholder="e.g. Floor 2, Room 204"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          {/* Row 3: Acquisition Date + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Acquisition Date"
              type="date"
              required
              value={form.acquisitionDate}
              onChange={(e) =>
                setForm({ ...form, acquisitionDate: e.target.value })
              }
            />
            <Input
              label="Acquisition Cost (Optional)"
              type="number"
              placeholder="0.00"
              value={form.acquisitionCost}
              onChange={(e) =>
                setForm({ ...form, acquisitionCost: e.target.value })
              }
            />
          </div>

          {/* Row 4: Condition + Status */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Condition"
              options={CONDITION_OPTIONS}
              selectedOption={
                CONDITION_OPTIONS.find((o) => o.value === form.condition) ??
                CONDITION_OPTIONS[1]
              }
              onChange={(val: any) =>
                setForm({ ...form, condition: val?.value || "GOOD" })
              }
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              selectedOption={
                STATUS_OPTIONS.find((o) => o.value === form.status) ??
                STATUS_OPTIONS[0]
              }
              onChange={(val: any) =>
                setForm({ ...form, status: val?.value || "AVAILABLE" })
              }
            />
          </div>

          {/* Row 5: Department + Assigned To */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department (Optional)"
              placeholder="Select department..."
              options={departmentOptions}
              selectedOption={
                departmentOptions.find((o) => o.value === form.departmentId) ??
                (null as any)
              }
              onChange={(val: any) =>
                setForm({ ...form, departmentId: val?.value || "" })
              }
            />
            <Select
              label="Assigned To (Optional)"
              placeholder="Select employee..."
              options={employeeOptions}
              selectedOption={
                employeeOptions.find((o) => o.value === form.userId) ??
                (null as any)
              }
              onChange={(val: any) =>
                setForm({ ...form, userId: val?.value || "" })
              }
            />
          </div>

          {/* Bookable toggle */}
          <div className="flex items-center gap-3 border border-gray-200 px-3 py-2.5">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                Bookable Resource
              </p>
              <p className="text-xs text-gray-500">
                Allow employees to book this asset for temporary use
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isBookable: !form.isBookable })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.isBookable ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  form.isBookable ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Update Asset"
                : "Register Asset"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState<Asset | null>(
    null,
  );

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets");
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery<AssetCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
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

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesCategory = !categoryFilter || a.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categoryFilterOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const statusFilterOptions = [
    { label: "All Statuses", value: "" },
    ...STATUS_OPTIONS,
  ];

  const columns = [
    {
      key: "assetTag",
      label: "Tag",
      sortable: true,
      formatValue: (_: any, row: Asset) => (
        <span className="font-mono text-xs font-semibold text-gray-600">
          {row.assetTag}
        </span>
      ),
    },
    {
      key: "name",
      label: "Asset Name",
      sortable: true,
      formatValue: (_: any, row: Asset) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.serialNumber && (
            <div className="text-xs text-gray-400">S/N: {row.serialNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      formatValue: (_: any, row: Asset) =>
        row.category ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            <Tag className="h-3 w-3" />
            {row.category.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "condition",
      label: "Condition",
      formatValue: (_: any, row: Asset) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_STYLES[row.condition]}`}
        >
          {row.condition.charAt(0) + row.condition.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      formatValue: (_: any, row: Asset) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
        >
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      formatValue: (_: any, row: Asset) =>
        row.department ? (
          <span className="text-sm text-gray-700">{row.department.name}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "user",
      label: "Assigned To",
      formatValue: (_: any, row: Asset) =>
        row.user ? (
          <div>
            <div className="text-sm font-medium text-gray-800">
              {row.user.name}
            </div>
            <div className="text-xs text-gray-400">{row.user.email}</div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "isBookable",
      label: "Bookable",
      formatValue: (_: any, row: Asset) =>
        row.isBookable ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
            <BookOpen className="h-3 w-3" />
            Yes
          </span>
        ) : (
          <span className="text-xs text-gray-400">No</span>
        ),
    },
    {
      key: "location",
      label: "Location",
      formatValue: (_: any, row: Asset) =>
        row.location ? (
          <span className="text-sm text-gray-600">{row.location}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      formatValue: (_: any, row: any) => (
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => {
              setEditingAsset(row);
              setModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="destructive"
            onClick={() => {
              setDeleteTargetAsset(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const openCreate = () => {
    setEditingAsset(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAsset(null);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Asset Directory</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Register, track, and manage all company assets across departments.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Register Asset
        </Button>
      </div>

      {/* Summary chips */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "Total",
              count: assets.length,
              cls: "bg-gray-100 text-gray-600",
            },
            {
              label: "Available",
              count: assets.filter((a) => a.status === "AVAILABLE").length,
              cls: "bg-green-100 text-green-700",
            },
            {
              label: "Allocated",
              count: assets.filter((a) => a.status === "ALLOCATED").length,
              cls: "bg-blue-100 text-blue-700",
            },
            {
              label: "Maintenance",
              count: assets.filter((a) => a.status === "UNDER_MAINTENANCE")
                .length,
              cls: "bg-yellow-100 text-yellow-700",
            },
          ].map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chip.cls}`}
            >
              {chip.label}
              <span className="rounded-full bg-white/50 px-1.5 py-0.5 font-bold tabular-nums">
                {chip.count}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Search + Filter Bar */}
      {assets.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 border-b border-gray-500">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, tag, or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white py-1.5 pr-8 pl-7 text-sm focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="w-44">
            <Select
              placeholder="All Statuses"
              options={statusFilterOptions}
              selectedOption={
                statusFilterOptions.find((o) => o.value === statusFilter) ??
                statusFilterOptions[0]
              }
              onChange={(val: any) => setStatusFilter(val?.value || "")}
            />
          </div>
          <div className="w-44">
            <Select
              placeholder="All Categories"
              options={categoryFilterOptions}
              selectedOption={
                categoryFilterOptions.find((o) => o.value === categoryFilter) ??
                categoryFilterOptions[0]
              }
              onChange={(val: any) => setCategoryFilter(val?.value || "")}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <Table2
          tableId="assets-table"
          initialColumns={columns}
          data={filtered}
          currentPage={0}
          pagination={filtered.length > 20}
          rowsPerPage={20}
          showFooter={false}
          onRowClick={(row: any) => {
            setEditingAsset(row);
            setModalOpen(true);
          }}
        />
      )}

      {/* Modal */}
      <AssetModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingAsset={editingAsset}
        categories={categories}
        departments={departments}
        employees={employees}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        type="Asset"
        name={deleteTargetAsset?.name ?? ""}
        description={`This will permanently delete "${deleteTargetAsset?.name}" (Tag: ${deleteTargetAsset?.assetTag}). This action cannot be undone.`}
        isOpen={!!deleteTargetAsset}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetAsset(null);
        }}
        onConfirm={() => {
          if (deleteTargetAsset) {
            deleteMutation.mutate(deleteTargetAsset.id);
            setDeleteTargetAsset(null);
          }
        }}
        deleting={deleteMutation.isPending}
      />
    </div>
  );
}

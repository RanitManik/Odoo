"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Table2 } from "@/components/ui/table";
import { FileSpreadsheet, RefreshCw } from "lucide-react";

// --- Types ---
interface Asset {
  id: string;
  name: string;
  assetTag: string;
  serialNumber: string | null;
  status: string;
  createdAt: string;
  purchaseCost: number | null;
  category: { id: string; name: string };
  department: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function ReportsPage() {
  // Filters state
  const [filters, setFilters] = useState({
    status: "",
    categoryId: "",
    departmentId: "",
    startDate: "",
    endDate: "",
  });

  // Queries
  const { data: categories = [] } = useQuery<Category[]>({
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

  const { data: assets = [], isLoading: assetsLoading, refetch } = useQuery<Asset[]>({
    queryKey: ["reports-assets", filters],
    queryFn: async () => {
      const res = await api.get("/assets", {
        params: {
          status: filters.status || undefined,
          categoryId: filters.categoryId || undefined,
          departmentId: filters.departmentId || undefined,
        },
      });
      // Client-side date filter since asset API doesn't filter dates directly
      let filtered = res.data as Asset[];
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        filtered = filtered.filter((a) => new Date(a.createdAt) >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        filtered = filtered.filter((a) => new Date(a.createdAt) <= end);
      }
      return filtered;
    },
  });

  // Dropdown options
  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Available", value: "AVAILABLE" },
    { label: "Allocated", value: "ALLOCATED" },
    { label: "Reserved", value: "RESERVED" },
    { label: "Under Maintenance", value: "UNDER_MAINTENANCE" },
    { label: "Under Investigation", value: "UNDER_INVESTIGATION" },
    { label: "Lost", value: "LOST" },
    { label: "Retired", value: "RETIRED" },
    { label: "Disposed", value: "DISPOSED" },
  ];

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const departmentOptions = [
    { label: "All Departments", value: "" },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ];

  // CSV Export Trigger
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.departmentId) params.append("departmentId", filters.departmentId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    window.open(`${api.defaults.baseURL}/reports/export-csv?${params.toString()}`, "_blank");
  };

  const columns = [
    {
      key: "asset",
      label: "Asset Info",
      formatValue: (_: any, row: Asset) => (
        <div>
          <div className="font-semibold text-gray-800">{row.name}</div>
          <div className="font-mono text-xs text-gray-400">{row.assetTag}</div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      formatValue: (_: any, row: Asset) => (
        <span className="text-sm text-gray-600">{row.category.name}</span>
      ),
    },
    {
      key: "department",
      label: "Department",
      formatValue: (_: any, row: Asset) => (
        <span className="text-sm text-gray-600">
          {row.department?.name ?? <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      formatValue: (_: any, row: Asset) => {
        const styles = {
          AVAILABLE: "bg-green-100 text-green-800",
          ALLOCATED: "bg-blue-100 text-blue-800",
          RESERVED: "bg-purple-100 text-purple-800",
          UNDER_MAINTENANCE: "bg-orange-100 text-orange-800",
          UNDER_INVESTIGATION: "bg-yellow-100 text-yellow-800",
          LOST: "bg-red-100 text-red-800",
          RETIRED: "bg-gray-100 text-gray-800",
          DISPOSED: "bg-gray-200 text-gray-800",
        }[row.status] || "bg-gray-100 text-gray-800";

        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "cost",
      label: "Purchase Cost",
      formatValue: (_: any, row: Asset) => (
        <span className="text-sm font-medium text-gray-700">
          {row.purchaseCost ? `$${row.purchaseCost.toLocaleString()}` : <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: "added",
      label: "Added Date",
      formatValue: (_: any, row: Asset) => (
        <span className="text-xs text-gray-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Asset Reports & Analytics
          </h2>
          <p className="text-muted-foreground mt-2">
            Filter, inspect, and export spreadsheet reports of your hardware and resource inventories.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="grid gap-4 md:grid-cols-5">
        <Select
          label="Status"
          options={statusOptions}
          selectedOption={statusOptions.find((o) => o.value === filters.status) ?? statusOptions[0]}
          onChange={(val: any) => setFilters({ ...filters, status: val?.value || "" })}
        />
        <Select
          label="Category"
          options={categoryOptions}
          selectedOption={categoryOptions.find((o) => o.value === filters.categoryId) ?? categoryOptions[0]}
          onChange={(val: any) => setFilters({ ...filters, categoryId: val?.value || "" })}
        />
        <Select
          label="Department"
          options={departmentOptions}
          selectedOption={departmentOptions.find((o) => o.value === filters.departmentId) ?? departmentOptions[0]}
          onChange={(val: any) => setFilters({ ...filters, departmentId: val?.value || "" })}
        />
        <Input
          label="Start Added Date"
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <Input
          label="End Added Date"
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>

      {/* Preview Table */}
      {assetsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <FileSpreadsheet className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">No assets match the active filters</p>
          <p className="text-sm text-gray-500">
            Adjust the filter settings above to update the preview results.
          </p>
        </div>
      ) : (
        <Table2
          tableId="reports-assets-table"
          initialColumns={columns}
          data={assets}
          currentPage={0}
          pagination={false}
          showFooter={false}
        />
      )}
    </div>
  );
}

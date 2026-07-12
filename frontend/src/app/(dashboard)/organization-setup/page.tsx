"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Table2 } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "@/components/ui/toast-provider";
import { Building2, Tag, Users, Plus, Search, X } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  headId: string | null;
  head: { id: string; name: string; email: string } | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count?: { users: number };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ASSET_MANAGER" | "DEPARTMENT_HEAD" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  departmentId: string | null;
  department: { id: string; name: string } | null;
}

type ActiveTab = "departments" | "categories" | "employees";

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState({
  message,
  onAdd,
  label,
}: {
  message: string;
  onAdd: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Building2 className="h-7 w-7 text-gray-400" />
      </div>
      <p className="mb-1 text-sm font-medium text-gray-900">Nothing here yet</p>
      <p className="mb-5 text-sm text-gray-500">{message}</p>
      <Button size="sm" onClick={onAdd}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </Button>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────────────
function TabBtn({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && (
        <span
          className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            active ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Department Modal ───────────────────────────────────────────────────────
function DepartmentModal({
  isOpen,
  onClose,
  departments,
  editingDept,
}: {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  editingDept: Department | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editingDept;

  const [form, setForm] = useState({
    name: editingDept?.name || "",
    parentId: editingDept?.parentId || "",
    status: editingDept?.status || "ACTIVE",
  });

  // Reset form on open
  React.useEffect(() => {
    if (isOpen) {
      setForm({
        name: editingDept?.name || "",
        parentId: editingDept?.parentId || "",
        status: editingDept?.status || "ACTIVE",
      });
    }
  }, [isOpen, editingDept]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) {
        const res = await api.patch(`/departments/${editingDept!.id}`, data);
        return res.data;
      }
      const res = await api.post("/departments", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Department updated!" : "Department created!");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const parentOptions = departments
    .filter((d) => !isEdit || d.id !== editingDept?.id)
    .map((d) => ({ label: d.name, value: d.id }));

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="sm">
      <ModalHeader>
        <ModalTitle title={isEdit ? "Edit Department" : "New Department"} />
      </ModalHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <ModalBody className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Engineering"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Parent Department (Optional)"
            placeholder="Select a parent department..."
            options={parentOptions}
            selectedOption={
              parentOptions.find((o) => o.value === form.parentId) ??
              (null as any)
            }
            onChange={(val: any) =>
              setForm({ ...form, parentId: val?.value || "" })
            }
          />
          <Select
            label="Status"
            options={statusOptions}
            selectedOption={
              statusOptions.find((o) => o.value === form.status) ??
              statusOptions[0]
            }
            onChange={(val: any) =>
              setForm({ ...form, status: val?.value || "ACTIVE" })
            }
            required
          />
        </ModalBody>
        <ModalFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Update"
                : "Create Department"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Category Modal ─────────────────────────────────────────────────────────
function CategoryModal({
  isOpen,
  onClose,
  editingCat,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingCat: Category | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editingCat;

  const [form, setForm] = useState({
    name: editingCat?.name || "",
    description: editingCat?.description || "",
    status: editingCat?.status || "ACTIVE",
  });

  React.useEffect(() => {
    if (isOpen) {
      setForm({
        name: editingCat?.name || "",
        description: editingCat?.description || "",
        status: editingCat?.status || "ACTIVE",
      });
    }
  }, [isOpen, editingCat]);

  const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) {
        const res = await api.patch(`/categories/${editingCat!.id}`, data);
        return res.data;
      }
      const res = await api.post("/categories", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Category updated!" : "Category created!");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="sm">
      <ModalHeader>
        <ModalTitle title={isEdit ? "Edit Category" : "New Category"} />
      </ModalHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <ModalBody className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Laptops & Computers"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Description"
            rows={3}
            placeholder="Brief description of this category..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Status"
            options={statusOptions}
            selectedOption={
              statusOptions.find((o) => o.value === form.status) ??
              statusOptions[0]
            }
            onChange={(val: any) =>
              setForm({ ...form, status: val?.value || "ACTIVE" })
            }
            required
          />
        </ModalBody>
        <ModalFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Update"
                : "Create Category"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Departments Tab ─────────────────────────────────────────────────────────
function DepartmentsTab({
  departments,
  isLoading,
  onAdd,
}: {
  departments: Department[];
  isLoading: boolean;
  onAdd: () => void;
}) {
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [search, setSearch] = useState("");

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    { key: "name", label: "Department", sortable: true },
    {
      key: "head",
      label: "Head",
      formatValue: (value: any, row: any) =>
        row.head ? (
          <div>
            <div className="font-medium text-gray-800">{row.head.name}</div>
            <div className="text-xs text-gray-400">{row.head.email}</div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "parent",
      label: "Parent Dept",
      formatValue: (value: any, row: any) =>
        row.parent ? (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {row.parent.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "users",
      label: "Members",
      formatValue: (value: any, row: any) => (
        <span className="text-sm">{row._count?.users ?? 0}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      formatValue: (value: any, row: any) => (
        <StatusBadge status={row.status === "ACTIVE" ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Edit",
          handleAction: (row: any) => setEditingDept(row),
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {departments.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 border-b border-gray-500">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
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
        </div>
      )}

      {filtered.length === 0 && departments.length === 0 ? (
        <EmptyState
          message="Create your first department to start organizing your company."
          onAdd={onAdd}
          label="Add Department"
        />
      ) : (
        <Table2
          tableId="departments-table"
          initialColumns={columns}
          data={filtered}
          currentPage={0}
          pagination={false}
          showFooter={false}
          onRowClick={(row: any) => setEditingDept(row)}
        />
      )}

      {departments.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Editing a department here also updates the department picklist in
          asset registration and allocation forms.
        </p>
      )}

      <DepartmentModal
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        departments={departments}
        editingDept={editingDept}
      />
    </>
  );
}

// ─── Categories Tab ──────────────────────────────────────────────────────────
function CategoriesTab({
  categories,
  isLoading,
  onAdd,
}: {
  categories: Category[];
  isLoading: boolean;
  onAdd: () => void;
}) {
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [search, setSearch] = useState("");

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      key: "name",
      label: "Category Name",
      sortable: true,
      formatValue: (value: any, row: any) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: "description",
      label: "Description",
      formatValue: (value: any, row: any) => (
        <span className="line-clamp-1">{row.description || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      formatValue: (value: any, row: any) => (
        <StatusBadge status={row.status === "ACTIVE" ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Edit",
          handleAction: (row: any) => setEditingCat(row),
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 border-b border-gray-500">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
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
        </div>
      )}

      {filtered.length === 0 && categories.length === 0 ? (
        <EmptyState
          message="Create asset categories to classify and manage your inventory."
          onAdd={onAdd}
          label="Add Category"
        />
      ) : (
        <Table2
          tableId="categories-table"
          initialColumns={columns}
          data={filtered}
          currentPage={0}
          pagination={false}
          showFooter={false}
          onRowClick={(row: any) => setEditingCat(row)}
        />
      )}

      <CategoryModal
        isOpen={!!editingCat}
        onClose={() => setEditingCat(null)}
        editingCat={editingCat}
      />
    </>
  );
}

// ─── Role Badge ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Dept. Head",
  EMPLOYEE: "Employee",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-purple-700",
  ASSET_MANAGER: "text-blue-700",
  DEPARTMENT_HEAD: "text-amber-700",
  EMPLOYEE: "text-gray-600",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`text-xs font-medium ${ROLE_COLORS[role] || "text-gray-600"}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ─── Employee Modal ──────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Asset Manager", value: "ASSET_MANAGER" },
  { label: "Department Head", value: "DEPARTMENT_HEAD" },
  { label: "Admin", value: "ADMIN" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

function EmployeeModal({
  isOpen,
  onClose,
  departments,
  editingEmployee,
}: {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  editingEmployee: Employee | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!editingEmployee;

  const [form, setForm] = useState({
    name: editingEmployee?.name || "",
    email: editingEmployee?.email || "",
    password: "",
    role: editingEmployee?.role || "EMPLOYEE",
    departmentId: editingEmployee?.departmentId || "",
    status: editingEmployee?.status || "ACTIVE",
  });

  React.useEffect(() => {
    if (isOpen) {
      setForm({
        name: editingEmployee?.name || "",
        email: editingEmployee?.email || "",
        password: "",
        role: editingEmployee?.role || "EMPLOYEE",
        departmentId: editingEmployee?.departmentId || "",
        status: editingEmployee?.status || "ACTIVE",
      });
    }
  }, [isOpen, editingEmployee]);

  const deptOptions = [
    { label: "No department", value: "" },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ];

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId || null,
        status: data.status,
      };
      if (!isEdit && data.password) payload.password = data.password;

      if (isEdit) {
        const res = await api.patch(
          `/employees/${editingEmployee!.id}`,
          payload,
        );
        return res.data;
      }
      const res = await api.post("/employees", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Employee updated!" : "Employee created!");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (err) => toast.error(extractError(err)),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="sm">
      <ModalHeader>
        <ModalTitle title={isEdit ? "Edit Employee" : "Add Employee"} />
      </ModalHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <ModalBody className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Priya Shah"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label={isEdit ? "Change Password (Optional)" : "Password"}
            type="password"
            placeholder={
              isEdit
                ? "Leave blank to keep current password"
                : "Min 8 characters"
            }
            required={!isEdit}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            selectedOption={
              ROLE_OPTIONS.find((o) => o.value === form.role) ?? ROLE_OPTIONS[0]
            }
            onChange={(val: any) =>
              setForm({ ...form, role: val?.value || "EMPLOYEE" })
            }
            required
          />
          <Select
            label="Department (Optional)"
            placeholder="Select department..."
            options={deptOptions}
            selectedOption={
              deptOptions.find((o) => o.value === form.departmentId) ??
              (null as any)
            }
            onChange={(val: any) =>
              setForm({ ...form, departmentId: val?.value || "" })
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
              setForm({ ...form, status: val?.value || "ACTIVE" })
            }
            required
          />
        </ModalBody>
        <ModalFooter>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Update"
                : "Add Employee"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ─── Employees Tab ───────────────────────────────────────────────────────────
function EmployeesTab({
  departments,
  onAdd,
}: {
  departments: Department[];
  onAdd: () => void;
}) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  const filtered = employees.filter(
    (e: any) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      formatValue: (value: any, row: any) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      formatValue: (value: any, row: any) => (
        <span className="text-gray-600">{row.email}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      formatValue: (value: any, row: any) => <RoleBadge role={row.role} />,
    },
    {
      key: "department",
      label: "Department",
      formatValue: (value: any, row: any) =>
        row.department ? (
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {row.department.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      formatValue: (value: any, row: any) => (
        <StatusBadge status={row.status === "ACTIVE" ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      action: true,
      options: [
        {
          option: "Edit",
          handleAction: (row: any) => setEditingEmployee(row),
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {employees.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 border-b border-gray-500">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
          {/* <span className="text-xs text-gray-400">{employees.length} total</span> */}
        </div>
      )}

      {filtered.length === 0 && employees.length === 0 ? (
        <EmptyState
          message="Add your first employee to start managing access and asset allocation."
          onAdd={onAdd}
          label="Add Employee"
        />
      ) : (
        <Table2
          tableId="employees-table"
          initialColumns={columns}
          data={filtered}
          currentPage={0}
          pagination={false}
          showFooter={false}
          onRowClick={(row: any) => setEditingEmployee(row)}
        />
      )}

      <EmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        departments={departments}
        editingEmployee={editingEmployee}
      />
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OrganizationSetupPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("departments");
  const [isDeptModalOpen, setDeptModalOpen] = useState(false);
  const [isCatModalOpen, setCatModalOpen] = useState(false);
  const [isEmpModalOpen, setEmpModalOpen] = useState(false);

  const { data: departments = [], isLoading: deptsLoading } = useQuery<
    Department[]
  >({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data;
    },
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
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

  const handleAdd = () => {
    if (activeTab === "departments") setDeptModalOpen(true);
    else if (activeTab === "categories") setCatModalOpen(true);
    else if (activeTab === "employees") setEmpModalOpen(true);
  };

  const addLabel =
    activeTab === "departments"
      ? "Add Department"
      : activeTab === "categories"
        ? "Add Category"
        : "Invite Employee";

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Organization Setup
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage departments, asset categories, and your employee directory.
          </p>
        </div>
        {activeTab !== "employees" ? (
          <Button size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {addLabel}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setEmpModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Employee
          </Button>
        )}
      </div>
      {/* Card */}
      <div className="">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <TabBtn
            active={activeTab === "departments"}
            icon={Building2}
            label="Departments"
            count={departments.length}
            onClick={() => setActiveTab("departments")}
          />
          <TabBtn
            active={activeTab === "categories"}
            icon={Tag}
            label="Asset Categories"
            count={categories.length}
            onClick={() => setActiveTab("categories")}
          />
          <TabBtn
            active={activeTab === "employees"}
            icon={Users}
            label="Employees"
            count={employees.length}
            onClick={() => setActiveTab("employees")}
          />
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === "departments" && (
            <DepartmentsTab
              departments={departments}
              isLoading={deptsLoading}
              onAdd={() => setDeptModalOpen(true)}
            />
          )}
          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              isLoading={catsLoading}
              onAdd={() => setCatModalOpen(true)}
            />
          )}
          {activeTab === "employees" && (
            <EmployeesTab
              departments={departments}
              onAdd={() => setEmpModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <DepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        departments={departments}
        editingDept={null}
      />
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setCatModalOpen(false)}
        editingCat={null}
      />
      <EmployeeModal
        isOpen={isEmpModalOpen}
        onClose={() => setEmpModalOpen(false)}
        departments={departments}
        editingEmployee={null}
      />
    </div>
  );
}

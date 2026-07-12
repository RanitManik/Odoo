"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractError } from "@/lib/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import CheckBox from "@/components/ui/check-box";
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
import { ClipboardList, Plus, Clock, ShieldAlert } from "lucide-react";

// --- Types ---
interface Asset {
  id: string;
  name: string;
  assetTag: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface Audit {
  id: string;
  assetId: string;
  asset: { id: string; name: string; assetTag: string; status: string };
  auditor: { id: string; name: string; email: string };
  dueDate: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "DISCREPANCY";
  verifiedCondition: string | null;
  locationVerified: boolean | null;
  notes: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export default function AuditPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "active" | "history" | "discrepancies"
  >("active");

  // Modals state
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [isVerifyOpen, setVerifyOpen] = useState(false);
  const [isResolveOpen, setResolveOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // Forms state
  const [scheduleForm, setScheduleForm] = useState({
    assetId: "",
    auditorId: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const [verifyForm, setVerifyForm] = useState({
    verifiedCondition: "GOOD",
    locationVerified: true,
    isDiscrepancy: false,
    notes: "",
  });

  const [resolveForm, setResolveForm] = useState({
    resolutionNotes: "",
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

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data;
    },
  });

  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["audits"],
    queryFn: async () => {
      const res = await api.get("/audits");
      return res.data;
    },
  });

  // Mutations
  const scheduleAuditMutation = useMutation({
    mutationFn: async (payload: typeof scheduleForm) => {
      const res = await api.post("/audits", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Audit scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      setScheduleOpen(false);
      setScheduleForm({
        assetId: "",
        auditorId: "",
        dueDate: new Date().toISOString().split("T")[0],
      });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const startAuditMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/audits/${id}/start`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Audit verification started");
      queryClient.invalidateQueries({ queryKey: ["audits"] });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const completeAuditMutation = useMutation({
    mutationFn: async (payload: { id: string; data: typeof verifyForm }) => {
      const res = await api.post(
        `/audits/${payload.id}/complete`,
        payload.data,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Audit verification submitted");
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setVerifyOpen(false);
      setSelectedAudit(null);
      setVerifyForm({
        verifiedCondition: "GOOD",
        locationVerified: true,
        isDiscrepancy: false,
        notes: "",
      });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  const resolveDiscrepancyMutation = useMutation({
    mutationFn: async (payload: { id: string; data: typeof resolveForm }) => {
      const res = await api.post(`/audits/${payload.id}/resolve`, payload.data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Discrepancy resolved and cleared!");
      queryClient.invalidateQueries({ queryKey: ["audits"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setResolveOpen(false);
      setSelectedAudit(null);
      setResolveForm({ resolutionNotes: "" });
    },
    onError: (err) => toast.error(extractError(err)),
  });

  // Options
  const assetOptions = assets.map((a) => ({
    label: `${a.name} (${a.assetTag})`,
    value: a.id,
  }));

  const auditorOptions = employees.map((e) => ({
    label: `${e.name} (${e.email})`,
    value: e.id,
  }));

  const conditionOptions = [
    { label: "New", value: "NEW" },
    { label: "Good", value: "GOOD" },
    { label: "Fair", value: "FAIR" },
    { label: "Poor", value: "POOR" },
    { label: "Damaged", value: "DAMAGED" },
  ];

  // Lists filter
  const activeAudits = audits.filter(
    (a) => a.status === "SCHEDULED" || a.status === "IN_PROGRESS",
  );
  const discrepancyAudits = audits.filter((a) => a.status === "DISCREPANCY");
  const historyAudits = audits.filter((a) => a.status === "COMPLETED");

  const statusLabels = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    DISCREPANCY: "Discrepancy Found",
  };

  const columns = [
    {
      key: "asset",
      label: "Asset",
      formatValue: (_: any, row: Audit) => (
        <div>
          <div className="font-semibold text-gray-800">{row.asset.name}</div>
          <div className="font-mono text-xs text-gray-400">
            {row.asset.assetTag}
          </div>
        </div>
      ),
    },
    {
      key: "auditor",
      label: "Auditor",
      formatValue: (_: any, row: Audit) => (
        <div>
          <div className="text-sm font-medium text-gray-700">
            {row.auditor.name}
          </div>
          <div className="text-xs text-gray-400">{row.auditor.email}</div>
        </div>
      ),
    },
    {
      key: "dueDate",
      label: "Schedule Date",
      formatValue: (_: any, row: Audit) => (
        <span className="text-sm text-gray-600">
          {new Date(row.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Workflow Status",
      formatValue: (_: any, row: Audit) => {
        const styles = {
          SCHEDULED: "bg-blue-100 text-blue-800",
          IN_PROGRESS: "bg-purple-100 text-purple-800",
          COMPLETED: "bg-green-100 text-green-800",
          DISCREPANCY: "bg-red-100 text-red-800",
        }[row.status];
        return (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}
          >
            {statusLabels[row.status]}
          </span>
        );
      },
    },
    {
      key: "details",
      label: "Audit Details",
      formatValue: (_: any, row: Audit) => {
        if (row.status === "SCHEDULED" || row.status === "IN_PROGRESS") {
          return (
            <span className="text-xs text-gray-400">
              Awaiting audit verification
            </span>
          );
        }
        return (
          <div className="space-y-1 text-xs text-gray-500">
            <div>
              Condition:{" "}
              <span className="font-medium text-gray-700">
                {row.verifiedCondition}
              </span>
            </div>
            <div>
              Location verified:{" "}
              <span className="font-medium text-gray-700">
                {row.locationVerified ? "Yes" : "No"}
              </span>
            </div>
            {row.notes && <div>Notes: {row.notes}</div>}
            {row.resolutionNotes && (
              <div className="font-medium text-green-600">
                Resolution: {row.resolutionNotes}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      formatValue: (_: any, row: Audit) => {
        if (row.status === "SCHEDULED") {
          return (
            <Button
              size="xs"
              variant="primary"
              onClick={() => startAuditMutation.mutate(row.id)}
            >
              Start Audit
            </Button>
          );
        }
        if (row.status === "IN_PROGRESS") {
          return (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                setSelectedAudit(row);
                setVerifyOpen(true);
              }}
            >
              Verify Asset
            </Button>
          );
        }
        if (row.status === "DISCREPANCY") {
          return (
            <Button
              size="xs"
              variant="primary"
              onClick={() => {
                setSelectedAudit(row);
                setResolveOpen(true);
              }}
            >
              Resolve Discrepancy
            </Button>
          );
        }
        return <span className="text-xs text-gray-400">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">
            Asset Audits
          </h2>
          <p className="text-muted-foreground mt-2">
            Schedule physical asset audits, assign auditors, flag discrepancies,
            and document resolutions.
          </p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Audit
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Active Audits
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {activeAudits.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("discrepancies")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "discrepancies"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Discrepancies Flagged
          <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
            {discrepancyAudits.length}
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
          Audit History
          <span className="bg-gray-150 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-600">
            {historyAudits.length}
          </span>
        </button>
      </div>

      {/* Tables list */}
      {auditsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : activeTab === "active" ? (
        activeAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-gray-200 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <ClipboardList className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">
              No active audits scheduled
            </p>
            <p className="mb-5 text-sm text-gray-500">
              Scheduled or In Progress audits will be tracking details here.
            </p>
            <Button size="sm" onClick={() => setScheduleOpen(true)}>
              Schedule Audit
            </Button>
          </div>
        ) : (
          <Table2
            tableId="active-audits-table"
            initialColumns={columns}
            data={activeAudits}
            currentPage={0}
            pagination={false}
            showFooter={false}
          />
        )
      ) : activeTab === "discrepancies" ? (
        discrepancyAudits.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <ShieldAlert className="h-7 w-7 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">
              No flagged discrepancies found
            </p>
            <p className="text-sm text-gray-500">
              All physical location or condition mismatches requiring resolution
              will appear here.
            </p>
          </div>
        ) : (
          <Table2
            tableId="discrepancies-audits-table"
            initialColumns={columns}
            data={discrepancyAudits}
            currentPage={0}
            pagination={false}
            showFooter={false}
          />
        )
      ) : historyAudits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">
            No completed audit history found
          </p>
          <p className="text-sm text-gray-500">
            Successfully completed check logs and discrepancy resolutions are
            cataloged here.
          </p>
        </div>
      ) : (
        <Table2
          tableId="history-audits-table"
          initialColumns={columns}
          data={historyAudits}
          currentPage={0}
          pagination={false}
          showFooter={false}
        />
      )}

      {/* --- SCHEDULE AUDIT MODAL --- */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setScheduleOpen(false)}
        width="sm"
      >
        <ModalHeader>
          <ModalTitle title="Schedule Physical Asset Audit" />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scheduleAuditMutation.mutate(scheduleForm);
          }}
        >
          <ModalBody className="space-y-4">
            <Select
              label="Select Asset"
              options={assetOptions}
              selectedOption={
                assetOptions.find((o) => o.value === scheduleForm.assetId) ??
                (null as any)
              }
              onChange={(val: any) =>
                setScheduleForm({ ...scheduleForm, assetId: val?.value || "" })
              }
              required
            />
            <Select
              label="Assign Auditor"
              options={auditorOptions}
              selectedOption={
                auditorOptions.find(
                  (o) => o.value === scheduleForm.auditorId,
                ) ?? (null as any)
              }
              onChange={(val: any) =>
                setScheduleForm({
                  ...scheduleForm,
                  auditorId: val?.value || "",
                })
              }
              required
            />
            <Input
              label="Audit Schedule Date"
              type="date"
              value={scheduleForm.dueDate}
              onChange={(e) =>
                setScheduleForm({ ...scheduleForm, dueDate: e.target.value })
              }
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={scheduleAuditMutation.isPending}>
              {scheduleAuditMutation.isPending
                ? "Scheduling..."
                : "Confirm Schedule"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* --- VERIFY AUDIT MODAL --- */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => setVerifyOpen(false)}
        width="sm"
      >
        <ModalHeader>
          <ModalTitle title="Verify Physical Asset Details" />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedAudit) {
              completeAuditMutation.mutate({
                id: selectedAudit.id,
                data: verifyForm,
              });
            }
          }}
        >
          <ModalBody className="space-y-4">
            <Select
              label="Physical Condition"
              options={conditionOptions}
              selectedOption={
                conditionOptions.find(
                  (o) => o.value === verifyForm.verifiedCondition,
                ) ?? conditionOptions[1]
              }
              onChange={(val: any) =>
                setVerifyForm({
                  ...verifyForm,
                  verifiedCondition: val?.value || "GOOD",
                })
              }
              required
            />
            <div className="border-gray-150 flex flex-col gap-2 border-b pb-2">
              <CheckBox
                id="locationVerified"
                label="Physical location verified matches system registry"
                checked={verifyForm.locationVerified}
                onCheck={(checked) =>
                  setVerifyForm({ ...verifyForm, locationVerified: checked })
                }
              />
              <CheckBox
                id="isDiscrepancy"
                label="Flag Discrepancy (requires investigation)"
                checked={verifyForm.isDiscrepancy}
                onCheck={(checked) =>
                  setVerifyForm({ ...verifyForm, isDiscrepancy: checked })
                }
              />
            </div>
            <Textarea
              label="Notes"
              placeholder="E.g., Mismatch in serial tag, minor physical wear..."
              value={verifyForm.notes}
              onChange={(e) =>
                setVerifyForm({ ...verifyForm, notes: e.target.value })
              }
              rows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="submit" disabled={completeAuditMutation.isPending}>
              {completeAuditMutation.isPending
                ? "Submitting..."
                : "Submit Verification"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* --- RESOLVE DISCREPANCY MODAL --- */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setResolveOpen(false)}
        width="sm"
      >
        <ModalHeader>
          <ModalTitle title="Resolve Flagged Discrepancy" />
        </ModalHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedAudit) {
              resolveDiscrepancyMutation.mutate({
                id: selectedAudit.id,
                data: resolveForm,
              });
            }
          }}
        >
          <ModalBody className="space-y-4">
            <Textarea
              label="Resolution Notes"
              placeholder="Explain how discrepancy was resolved..."
              value={resolveForm.resolutionNotes}
              onChange={(e) =>
                setResolveForm({ resolutionNotes: e.target.value })
              }
              required
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              disabled={resolveDiscrepancyMutation.isPending}
            >
              {resolveDiscrepancyMutation.isPending
                ? "Resolving..."
                : "Clear Discrepancy"}
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

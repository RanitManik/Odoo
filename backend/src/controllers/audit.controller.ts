import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const createAuditSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  auditorId: z.string().uuid("Invalid auditor ID"),
  dueDate: z.string().transform((v) => new Date(v)),
});

const completeAuditSchema = z.object({
  verifiedCondition: z.string().min(1, "Verified condition is required"),
  locationVerified: z.boolean(),
  notes: z.string().optional().nullable(),
  isDiscrepancy: z.boolean(),
});

const resolveDiscrepancySchema = z.object({
  resolutionNotes: z.string().min(1, "Resolution notes are required"),
});

/**
 * GET /api/audits
 */
export const getAllAudits = async (req: AuthRequest, res: Response) => {
  const audits = await prisma.audit.findMany({
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          status: true,
        },
      },
      auditor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return res.json(audits);
};

/**
 * POST /api/audits
 */
export const createAudit = async (req: AuthRequest, res: Response) => {
  const data = createAuditSchema.parse(req.body);
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: data.assetId },
  });

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  const auditor = await prisma.user.findUnique({
    where: { id: data.auditorId },
  });

  if (!auditor) {
    return res.status(404).json({ error: "Auditor not found" });
  }

  const audit = await prisma.audit.create({
    data: {
      assetId: data.assetId,
      auditorId: data.auditorId,
      dueDate: data.dueDate,
      status: "SCHEDULED",
    },
    include: {
      asset: true,
      auditor: true,
    },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: data.assetId,
      action: "AUDIT_SCHEDULED",
      details: `Physical audit scheduled for ${data.dueDate.toLocaleDateString()}. Auditor: ${auditor.name}`,
      userId: currentUserId,
    },
  });

  return res.status(201).json(audit);
};

/**
 * POST /api/audits/:id/start
 */
export const startAudit = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const audit = await prisma.audit.findUnique({
    where: { id },
  });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  if (audit.status !== "SCHEDULED") {
    return res.status(400).json({ error: "Audit is already started or completed" });
  }

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: audit.assetId,
      action: "AUDIT_STARTED",
      details: "Physical asset audit started.",
      userId: currentUserId,
    },
  });

  return res.json(updatedAudit);
};

/**
 * POST /api/audits/:id/complete
 */
export const completeAudit = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = completeAuditSchema.parse(req.body);
  const currentUserId = req.user?.id || null;

  const audit = await prisma.audit.findUnique({
    where: { id },
  });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  const status = data.isDiscrepancy ? "DISCREPANCY" : "COMPLETED";

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: {
      status,
      verifiedCondition: data.verifiedCondition,
      locationVerified: data.locationVerified,
      notes: data.notes || null,
    },
  });

  // If discrepancy is found, flip asset to UNDER_INVESTIGATION
  if (data.isDiscrepancy) {
    await prisma.asset.update({
      where: { id: audit.assetId },
      data: { status: "UNDER_INVESTIGATION" },
    });

    // Log in asset history
    await prisma.assetHistory.create({
      data: {
        assetId: audit.assetId,
        action: "AUDIT_DISCREPANCY_FOUND",
        details: `Audit discrepancy flagged: "${data.notes}". Condition: ${data.verifiedCondition}. Asset status set to Under Investigation.`,
        userId: currentUserId,
      },
    });
  } else {
    // Log in asset history
    await prisma.assetHistory.create({
      data: {
        assetId: audit.assetId,
        action: "AUDIT_COMPLETED",
        details: `Audit completed successfully. Condition: ${data.verifiedCondition}. location match: ${data.locationVerified}`,
        userId: currentUserId,
      },
    });
  }

  return res.json(updatedAudit);
};

/**
 * POST /api/audits/:id/resolve
 */
export const resolveDiscrepancy = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = resolveDiscrepancySchema.parse(req.body);
  const currentUserId = req.user?.id || null;

  const audit = await prisma.audit.findUnique({
    where: { id },
  });

  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  if (audit.status !== "DISCREPANCY") {
    return res.status(400).json({ error: "Audit does not have a flagged discrepancy" });
  }

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: {
      status: "COMPLETED",
      resolutionNotes: data.resolutionNotes,
    },
  });

  // Revert asset status back to AVAILABLE
  await prisma.asset.update({
    where: { id: audit.assetId },
    data: { status: "AVAILABLE" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: audit.assetId,
      action: "AUDIT_DISCREPANCY_RESOLVED",
      details: `Audit discrepancy resolved: "${data.resolutionNotes}". Asset status reverted back to Available.`,
      userId: currentUserId,
    },
  });

  return res.json(updatedAudit);
};

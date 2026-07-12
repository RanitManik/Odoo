import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { createNotification } from "../services/notification.service";

const createRequestSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  photo: z.string().optional().nullable(),
});

const assignTechSchema = z.object({
  technician: z.string().min(1, "Technician name is required"),
});

/**
 * GET /api/maintenance
 */
export const getAllRequests = async (req: AuthRequest, res: Response) => {
  const requests = await prisma.maintenanceRequest.findMany({
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(requests);
};

/**
 * POST /api/maintenance
 */
export const createRequest = async (req: AuthRequest, res: Response) => {
  const data = createRequestSchema.parse(req.body);
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

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      userId: currentUserId,
      description: data.description,
      priority: data.priority || "MEDIUM",
      status: "PENDING",
      photo: data.photo || null,
    },
    include: {
      asset: true,
      user: true,
    },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: data.assetId,
      action: "MAINTENANCE_REQUESTED",
      details: `Maintenance request raised: "${data.description}". Priority: ${request.priority}`,
      userId: currentUserId,
    },
  });

  return res.status(201).json(request);
};

/**
 * POST /api/maintenance/:id/approve
 */
export const approveRequest = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request is already processed" });
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  // Auto update asset status to UNDER_MAINTENANCE
  await prisma.asset.update({
    where: { id: request.assetId },
    data: { status: "UNDER_MAINTENANCE" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: request.assetId,
      action: "MAINTENANCE_APPROVED",
      details:
        "Maintenance request approved. Asset status set to Under Maintenance.",
      userId: currentUserId,
    },
  });

  // Notify requestor that maintenance was approved
  await createNotification(
    request.userId,
    "Maintenance Approved",
    `Your maintenance request for asset ID "${request.assetId}" has been approved.`,
    "MAINTENANCE_APPROVED",
  );

  return res.json(updatedRequest);
};

/**
 * POST /api/maintenance/:id/reject
 */
export const rejectRequest = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  if (request.status !== "PENDING") {
    return res.status(400).json({ error: "Request is already processed" });
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: request.assetId,
      action: "MAINTENANCE_REJECTED",
      details: "Maintenance request rejected.",
      userId: currentUserId,
    },
  });

  // Notify requestor that maintenance was rejected
  await createNotification(
    request.userId,
    "Maintenance Rejected",
    `Your maintenance request for asset ID "${request.assetId}" was rejected.`,
    "MAINTENANCE_REJECTED",
  );

  return res.json(updatedRequest);
};

/**
 * POST /api/maintenance/:id/assign
 */
export const assignTechnician = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = assignTechSchema.parse(req.body);
  const currentUserId = req.user?.id || null;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: "TECHNICIAN_ASSIGNED",
      technician: data.technician,
    },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: request.assetId,
      action: "MAINTENANCE_TECH_ASSIGNED",
      details: `Technician "${data.technician}" assigned to maintenance work.`,
      userId: currentUserId,
    },
  });

  return res.json(updatedRequest);
};

/**
 * POST /api/maintenance/:id/start
 */
export const startMaintenance = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: request.assetId,
      action: "MAINTENANCE_STARTED",
      details: "Maintenance work started.",
      userId: currentUserId,
    },
  });

  return res.json(updatedRequest);
};

/**
 * POST /api/maintenance/:id/resolve
 */
export const resolveRequest = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return res.status(404).json({ error: "Maintenance request not found" });
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: { status: "RESOLVED" },
  });

  // Auto reset asset status to AVAILABLE
  await prisma.asset.update({
    where: { id: request.assetId },
    data: { status: "AVAILABLE" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: request.assetId,
      action: "MAINTENANCE_RESOLVED",
      details:
        "Maintenance work completed and resolved. Asset status set to Available.",
      userId: currentUserId,
    },
  });

  return res.json(updatedRequest);
};

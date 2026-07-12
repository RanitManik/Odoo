import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { createNotification } from "../services/notification.service";

const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  serialNumber: z.string().optional().nullable(),
  acquisitionDate: z.string().transform((v) => new Date(v)),
  acquisitionCost: z.number().nonnegative().optional().nullable(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  location: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
  status: z
    .enum([
      "AVAILABLE",
      "ALLOCATED",
      "RESERVED",
      "UNDER_MAINTENANCE",
      "LOST",
      "RETIRED",
      "DISPOSED",
    ])
    .optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  userId: z.string().uuid("Invalid employee ID").optional().nullable(),
});

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  serialNumber: z.string().optional().nullable(),
  acquisitionDate: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  acquisitionCost: z.number().nonnegative().optional().nullable(),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  location: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isBookable: z.boolean().optional(),
  status: z
    .enum([
      "AVAILABLE",
      "ALLOCATED",
      "RESERVED",
      "UNDER_MAINTENANCE",
      "LOST",
      "RETIRED",
      "DISPOSED",
    ])
    .optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  userId: z.string().uuid("Invalid employee ID").optional().nullable(),
});

/**
 * GET /api/assets
 */
export const getAllAssets = async (req: AuthRequest, res: Response) => {
  const { status, categoryId, departmentId } = req.query;

  const whereClause: any = {};
  if (status) whereClause.status = String(status);
  if (categoryId) whereClause.categoryId = String(categoryId);
  if (departmentId) whereClause.departmentId = String(departmentId);

  const assets = await prisma.asset.findMany({
    where: whereClause,
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(assets);
};

/**
 * GET /api/assets/:id
 */
export const getAsset = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
      history: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }
  return res.json(asset);
};

/**
 * POST /api/assets
 */
export const createAsset = async (req: AuthRequest, res: Response) => {
  const data = createAssetSchema.parse(req.body);

  // Generate unique asset tag (AF-XXXX)
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { createdAt: "desc" },
  });
  let nextNum = 1;
  if (lastAsset && lastAsset.assetTag) {
    const match = lastAsset.assetTag.match(/AF-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  const assetTag = `AF-${String(nextNum).padStart(4, "0")}`;

  const currentUserId = req.user?.id || null;

  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      assetTag,
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate,
      acquisitionCost: data.acquisitionCost,
      condition: data.condition || "GOOD",
      location: data.location,
      image: data.image,
      isBookable: data.isBookable || false,
      status: data.status || "AVAILABLE",
      categoryId: data.categoryId,
      departmentId: data.departmentId,
      userId: data.userId,
    },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Log creation in history
  await prisma.assetHistory.create({
    data: {
      assetId: asset.id,
      action: "CREATED",
      details: `Asset registered with tag ${assetTag}. Initial status: ${asset.status}.`,
      userId: currentUserId,
    },
  });

  return res.status(201).json(asset);
};

/**
 * PATCH /api/assets/:id
 */
export const updateAsset = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = updateAssetSchema.parse(req.body);

  const existingAsset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!existingAsset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  const currentUserId = req.user?.id || null;

  // Track changes for history logging
  const changes: string[] = [];
  if (data.name && data.name !== existingAsset.name) {
    changes.push(`Name changed from "${existingAsset.name}" to "${data.name}"`);
  }
  if (data.status && data.status !== existingAsset.status) {
    changes.push(
      `Status changed from ${existingAsset.status} to ${data.status}`,
    );
  }
  if (data.condition && data.condition !== existingAsset.condition) {
    changes.push(
      `Condition changed from ${existingAsset.condition} to ${data.condition}`,
    );
  }
  if (data.location !== undefined && data.location !== existingAsset.location) {
    changes.push(
      `Location changed from "${existingAsset.location || "None"}" to "${data.location || "None"}"`,
    );
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (changes.length > 0) {
    await prisma.assetHistory.create({
      data: {
        assetId: asset.id,
        action: "UPDATED",
        details: changes.join("; "),
        userId: currentUserId,
      },
    });
  }

  return res.json(asset);
};

/**
 * DELETE /api/assets/:id
 */
export const deleteAsset = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const existingAsset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!existingAsset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  await prisma.asset.delete({
    where: { id },
  });

  return res.json({ message: "Asset deleted successfully" });
};

const allocateAssetSchema = z.object({
  userId: z.string().uuid("Invalid employee ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  expectedReturnDate: z
    .string()
    .transform((v) => (v ? new Date(v) : null))
    .optional()
    .nullable(),
});

export const allocateAsset = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = allocateAssetSchema.parse(req.body);

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  // Conflict Rule: Check if already allocated
  if (asset.status === "ALLOCATED") {
    const currentlyHeldBy =
      asset.user?.name || asset.department?.name || "another user/department";
    return res.status(400).json({
      error: `Asset is currently held by ${currentlyHeldBy}`,
      currentlyHeldBy,
    });
  }

  const updatedAsset = await prisma.asset.update({
    where: { id },
    data: {
      status: "ALLOCATED",
      userId: data.userId || null,
      departmentId: data.departmentId || null,
      expectedReturnDate: data.expectedReturnDate || null,
    },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Log in history
  const currentUserId = req.user?.id || null;
  const targetName =
    updatedAsset.user?.name || updatedAsset.department?.name || "";
  await prisma.assetHistory.create({
    data: {
      assetId: asset.id,
      action: "ALLOCATED",
      details: `Asset allocated to ${targetName}. Expected Return Date: ${
        data.expectedReturnDate
          ? new Date(data.expectedReturnDate).toLocaleDateString()
          : "None"
      }`,
      userId: currentUserId,
    },
  });

  // Trigger notification for the employee if allocated directly to a user
  if (data.userId) {
    await createNotification(
      data.userId,
      "Asset Assigned",
      `The physical asset "${updatedAsset.name}" has been assigned to you. Expected return: ${
        data.expectedReturnDate
          ? new Date(data.expectedReturnDate).toLocaleDateString()
          : "Not scheduled"
      }.`,
      "ASSET_ASSIGNED",
    );
  }

  return res.json(updatedAsset);
};

const returnAssetSchema = z.object({
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  notes: z.string().optional().nullable(),
});

export const returnAsset = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = returnAssetSchema.parse(req.body);

  const asset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  const updatedAsset = await prisma.asset.update({
    where: { id },
    data: {
      status: "AVAILABLE",
      userId: null,
      departmentId: null,
      expectedReturnDate: null,
      condition: data.condition,
    },
    include: {
      category: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Log in history
  const currentUserId = req.user?.id || null;
  await prisma.assetHistory.create({
    data: {
      assetId: asset.id,
      action: "RETURNED",
      details: `Asset returned. Condition checked in as: ${
        data.condition
      }. Notes: ${data.notes || "None"}`,
      userId: currentUserId,
    },
  });

  // Trigger notification if there was a user holding it
  if (asset.userId) {
    await createNotification(
      asset.userId,
      "Asset Return Processed",
      `The return check-in for "${asset.name}" has been completed (Condition: ${data.condition}).`,
      "ASSET_RETURNED",
    );
  }

  return res.json(updatedAsset);
};

const transferRequestSchema = z.object({
  targetUserId: z.string().uuid().optional().nullable(),
  targetDeptId: z.string().uuid().optional().nullable(),
});

export const createTransferRequest = async (
  req: AuthRequest,
  res: Response,
) => {
  const id = req.params.id as string;
  const data = transferRequestSchema.parse(req.body);
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const asset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  // Create transfer request
  const request = await prisma.transferRequest.create({
    data: {
      assetId: id,
      requestorId: currentUserId,
      targetUserId: data.targetUserId || null,
      targetDeptId: data.targetDeptId || null,
      status: "PENDING",
    },
  });

  // Log in history
  await prisma.assetHistory.create({
    data: {
      assetId: id,
      action: "TRANSFER_REQUESTED",
      details: `Transfer requested to ${
        data.targetUserId
          ? "User " + data.targetUserId
          : "Dept " + data.targetDeptId
      }`,
      userId: currentUserId,
    },
  });

  return res.status(201).json(request);
};

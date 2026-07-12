import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";

/**
 * GET /api/transfers
 */
export const getAllTransfers = async (req: AuthRequest, res: Response) => {
  const transfers = await prisma.transferRequest.findMany({
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          status: true,
        },
      },
      requestor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      targetDept: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(transfers);
};

/**
 * POST /api/transfers/:id/approve
 */
export const approveTransfer = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: {
      asset: true,
      targetUser: true,
      targetDept: true,
    },
  });

  if (!transfer) {
    return res.status(404).json({ error: "Transfer request not found" });
  }

  if (transfer.status !== "PENDING") {
    return res
      .status(400)
      .json({ error: `Transfer request is already ${transfer.status.toLowerCase()}` });
  }

  // Update Transfer Status
  const updatedTransfer = await prisma.transferRequest.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  // Re-allocate Asset to the target user or department
  const updatedAsset = await prisma.asset.update({
    where: { id: transfer.assetId },
    data: {
      userId: transfer.targetUserId,
      departmentId: transfer.targetDeptId,
      status: "ALLOCATED",
    },
  });

  // Log in Asset History
  const targetName =
    transfer.targetUser?.name || transfer.targetDept?.name || "new owner";
  await prisma.assetHistory.create({
    data: {
      assetId: transfer.assetId,
      action: "TRANSFERRED",
      details: `Asset transferred to ${targetName} via approved transfer request.`,
      userId: currentUserId,
    },
  });

  return res.json({ transfer: updatedTransfer, asset: updatedAsset });
};

/**
 * POST /api/transfers/:id/reject
 */
export const rejectTransfer = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
  });

  if (!transfer) {
    return res.status(404).json({ error: "Transfer request not found" });
  }

  if (transfer.status !== "PENDING") {
    return res
      .status(400)
      .json({ error: `Transfer request is already ${transfer.status.toLowerCase()}` });
  }

  const updatedTransfer = await prisma.transferRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  // Log rejection in history
  await prisma.assetHistory.create({
    data: {
      assetId: transfer.assetId,
      action: "TRANSFER_REJECTED",
      details: "Transfer request was rejected.",
      userId: currentUserId,
    },
  });

  return res.json(updatedTransfer);
};

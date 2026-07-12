import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";

/**
 * GET /api/notifications
 */
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return res.json(notifications);
};

/**
 * POST /api/notifications/:id/read
 */
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return res.json(updated);
};

/**
 * POST /api/notifications/read-all
 */
export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return res.json({ message: "All notifications marked as read" });
};

/**
 * GET /api/notifications/activities
 */
export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  const logs = await prisma.assetHistory.findMany({
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Manually fetch and attach user details to avoid cached relation errors on running servers
  const userIds = Array.from(
    new Set(logs.map((log) => log.userId).filter(Boolean)),
  ) as string[];

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const logsWithUser = logs.map((log) => ({
    ...log,
    user: log.userId ? userMap.get(log.userId) || null : null,
  }));

  return res.json(logsWithUser);
};

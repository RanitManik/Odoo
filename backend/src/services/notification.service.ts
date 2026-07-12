import { prisma } from "../lib/prisma";

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string
) => {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

export const notifyAdminsAndManagers = async (
  title: string,
  message: string,
  type: string
) => {
  try {
    const targets = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "ASSET_MANAGER"],
        },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const createPromises = targets.map((t) =>
      prisma.notification.create({
        data: {
          userId: t.id,
          title,
          message,
          type,
        },
      })
    );

    await Promise.all(createPromises);
  } catch (error) {
    console.error("Failed to notify admins/managers:", error);
  }
};

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const createBookingSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  startTime: z.string().transform((v) => new Date(v)),
  endTime: z.string().transform((v) => new Date(v)),
});

/**
 * GET /api/bookings
 */
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  const { assetId } = req.query;

  const bookings = await prisma.booking.findMany({
    where: assetId ? { assetId: String(assetId) } : {},
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          isBookable: true,
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
    orderBy: { startTime: "asc" },
  });

  return res.json(bookings);
};

/**
 * POST /api/bookings
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  const data = createBookingSchema.parse(req.body);
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

  if (!asset.isBookable) {
    return res.status(400).json({ error: "Asset is not registered as a bookable resource" });
  }

  if (data.startTime >= data.endTime) {
    return res.status(400).json({ error: "End time must be after start time" });
  }

  if (data.startTime < new Date()) {
    return res.status(400).json({ error: "Cannot book a slot in the past" });
  }

  // Overlap validation check:
  // Reject if any existing booking for this asset overlapping the request is either UPCOMING or ONGOING
  const overlapping = await prisma.booking.findFirst({
    where: {
      assetId: data.assetId,
      status: { in: ["UPCOMING", "ONGOING"] },
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
    include: {
      user: { select: { name: true } },
    },
  });

  if (overlapping) {
    return res.status(400).json({
      error: `Time-slot overlaps with an existing booking by ${overlapping.user.name} (${new Date(
        overlapping.startTime
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(
        overlapping.endTime
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
    });
  }

  const booking = await prisma.booking.create({
    data: {
      assetId: data.assetId,
      userId: currentUserId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: "UPCOMING",
    },
    include: {
      asset: true,
      user: true,
    },
  });

  // Log creation in history
  await prisma.assetHistory.create({
    data: {
      assetId: data.assetId,
      action: "BOOKED",
      details: `Asset booked from ${booking.startTime.toLocaleString()} to ${booking.endTime.toLocaleString()}`,
      userId: currentUserId,
    },
  });

  return res.status(201).json(booking);
};

/**
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const currentUserId = req.user?.id || null;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ error: "Booking is already cancelled" });
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Log in asset history
  await prisma.assetHistory.create({
    data: {
      assetId: booking.assetId,
      action: "BOOKING_CANCELLED",
      details: `Booking from ${booking.startTime.toLocaleString()} to ${booking.endTime.toLocaleString()} was cancelled`,
      userId: currentUserId,
    },
  });

  return res.json(updatedBooking);
};

import { Router } from "express";
import {
  getAllBookings,
  createBooking,
  cancelBooking,
} from "../controllers/booking.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.get("/", getAllBookings);
router.post("/", createBooking);
router.post("/:id/cancel", cancelBooking);

export default router;

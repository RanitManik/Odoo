import { Router } from "express";
import {
  getAllTransfers,
  approveTransfer,
  rejectTransfer,
} from "../controllers/transfer.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Require authentication for all transfer routes
router.use(authenticate);

router.get("/", getAllTransfers);
router.post("/:id/approve", approveTransfer);
router.post("/:id/reject", rejectTransfer);

export default router;

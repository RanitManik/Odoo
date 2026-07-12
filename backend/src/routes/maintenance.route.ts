import { Router } from "express";
import {
  getAllRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startMaintenance,
  resolveRequest,
} from "../controllers/maintenance.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

router.get("/", getAllRequests);
router.post("/", createRequest);
router.post("/:id/approve", approveRequest);
router.post("/:id/reject", rejectRequest);
router.post("/:id/assign", assignTechnician);
router.post("/:id/start", startMaintenance);
router.post("/:id/resolve", resolveRequest);

export default router;

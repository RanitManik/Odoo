import { Router } from "express";
import {
  getAllAudits,
  createAudit,
  startAudit,
  completeAudit,
  resolveDiscrepancy,
} from "../controllers/audit.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All audit routes require authentication
router.use(authenticate);

router.get("/", getAllAudits);
router.post("/", createAudit);
router.post("/:id/start", startAudit);
router.post("/:id/complete", completeAudit);
router.post("/:id/resolve", resolveDiscrepancy);

export default router;

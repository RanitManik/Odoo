import { Router } from "express";
import { exportCSV } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All report routes require authentication
router.use(authenticate);

router.get("/export-csv", exportCSV);

export default router;

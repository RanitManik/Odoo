import { Router } from "express";
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} from "../controllers/employee.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All employee routes require authentication
router.use(authenticate);

router.get("/", getAllEmployees);
router.get("/:id", getEmployee);
router.post("/", createEmployee);
router.patch("/:id", updateEmployee);
router.put("/:id", updateEmployee);

export default router;

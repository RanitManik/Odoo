import { Router } from "express";
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
} from "../controllers/employee.controller";
import { authenticate, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

// All employee routes require authentication
router.use(authenticate);

router.get("/", getAllEmployees);
router.get("/:id", getEmployee);
router.post("/", authorizeRole(["ADMIN"]), createEmployee);
router.patch("/:id", authorizeRole(["ADMIN"]), updateEmployee);
router.put("/:id", authorizeRole(["ADMIN"]), updateEmployee);

export default router;

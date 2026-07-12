import { Router } from "express";
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
} from "../controllers/department.controller";
import { authenticate, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate); // Require authentication for all department routes

router.get("/", getAllDepartments);
router.post("/", authorizeRole(["ADMIN"]), createDepartment);
router.put("/:id", authorizeRole(["ADMIN"]), updateDepartment);
router.patch("/:id", authorizeRole(["ADMIN"]), updateDepartment);

export default router;

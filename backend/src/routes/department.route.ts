import { Router } from "express";
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
} from "../controllers/department.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate); // Require authentication for all department routes

router.get("/", getAllDepartments);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.patch("/:id", updateDepartment);

export default router;

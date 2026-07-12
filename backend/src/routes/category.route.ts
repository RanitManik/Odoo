import { Router } from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from "../controllers/category.controller";
import { authenticate, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate); // Require authentication

router.get("/", getAllCategories);
router.post("/", authorizeRole(["ADMIN"]), createCategory);
router.put("/:id", authorizeRole(["ADMIN"]), updateCategory);
router.patch("/:id", authorizeRole(["ADMIN"]), updateCategory);

export default router;

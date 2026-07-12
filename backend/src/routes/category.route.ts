import { Router } from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate); // Require authentication

router.get("/", getAllCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/:id", updateCategory);

export default router;

import { Router } from "express";
import {
  getAllAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  allocateAsset,
  returnAsset,
  createTransferRequest,
} from "../controllers/asset.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All asset routes require authentication
router.use(authenticate);

router.get("/", getAllAssets);
router.get("/:id", getAsset);
router.post("/", createAsset);
router.patch("/:id", updateAsset);
router.put("/:id", updateAsset);
router.delete("/:id", deleteAsset);

router.post("/:id/allocate", allocateAsset);
router.post("/:id/return", returnAsset);
router.post("/:id/transfer-request", createTransferRequest);

export default router;

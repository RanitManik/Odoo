import { Router } from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLogs,
} from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All notification/activity routes require auth
router.use(authenticate);

router.get("/", getUserNotifications);
router.get("/activities", getActivityLogs);
router.post("/read-all", markAllNotificationsRead);
router.post("/:id/read", markNotificationRead);

export default router;

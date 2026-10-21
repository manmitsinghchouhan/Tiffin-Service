import { Router } from "express";
import {
  getWeeklyMenu,
  saveWeeklyMenu,
  addMenuItem,
  updateMealWindow,
  deleteMenuItem,
  copyDayMenu,
  resetWeeklyMenu,
} from "../controllers/providerMenuController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All weekly menu endpoints require an authenticated PROVIDER session
router.use(authenticate, isProvider);

// Core schedule endpoints
router.get("/", getWeeklyMenu);
router.put("/", saveWeeklyMenu);

// Granular item and meal operations
router.post("/item", addMenuItem);
router.patch("/meal", updateMealWindow);
router.delete("/item/:id", deleteMenuItem);

// Bulk operations
router.post("/copy-day", copyDayMenu);
router.post("/reset", resetWeeklyMenu);

export default router;

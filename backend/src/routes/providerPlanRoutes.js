import { Router } from "express";
import {
  getProviderPlans,
  createProviderPlan,
  getProviderPlanById,
  updateProviderPlan,
  togglePlanStatus,
  deleteProviderPlan,
} from "../controllers/providerPlanController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All plan routes require authenticated PROVIDER session
router.use(authenticate, isProvider);

router.get("/", getProviderPlans);
router.post("/", createProviderPlan);

router.get("/:id", getProviderPlanById);
router.patch("/:id", updateProviderPlan);
router.patch("/:id/toggle-status", togglePlanStatus);
router.delete("/:id", deleteProviderPlan);

export default router;

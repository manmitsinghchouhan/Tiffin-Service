import { Router } from "express";
import {
  getProviderOrderStats,
  getProviderDailyDispatch,
  getProviderOrders,
  getProviderOrderById,
  updateProviderOrderStatus,
  updateSubscriptionDispatchStatus,
} from "../controllers/providerOrderController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All routes are strictly private to authenticated verified providers
router.use(authenticate, isProvider);

// KPI Stats endpoint (declared before /:id)
router.get("/stats", getProviderOrderStats);

// Daily Kitchen Run-Sheet & Dispatch Engine
router.get("/daily-dispatch", getProviderDailyDispatch);
router.patch("/dispatch-status/:subscriptionId", updateSubscriptionDispatchStatus);

// Commercial orders list with search, filter, and pagination
router.get("/", getProviderOrders);

// Single order details & invoice receipt
router.get("/:id", getProviderOrderById);

// Update order status (ACCEPT, REJECT, COMPLETE, CANCEL)
router.patch("/:id/status", updateProviderOrderStatus);

export default router;

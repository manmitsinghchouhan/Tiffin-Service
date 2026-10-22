import { Router } from "express";
import {
  getProviderSubscriptionStats,
  getProviderSubscriptions,
  getProviderSubscriptionById,
  pauseProviderSubscription,
  resumeProviderSubscription,
  cancelProviderSubscription,
  updateProviderSubscriptionAddress,
} from "../controllers/providerSubscriptionController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All routes are strictly private to authenticated verified providers
router.use(authenticate, isProvider);

// KPI Stats endpoint (must be declared before /:id)
router.get("/stats", getProviderSubscriptionStats);

// Subscriptions list with search, filter, and pagination
router.get("/", getProviderSubscriptions);

// Single subscription details
router.get("/:id", getProviderSubscriptionById);

// Provider Subscription Actions
router.patch("/:id/pause", pauseProviderSubscription);
router.patch("/:id/resume", resumeProviderSubscription);
router.patch("/:id/cancel", cancelProviderSubscription);
router.patch("/:id/address", updateProviderSubscriptionAddress);

export default router;

import { Router } from "express";
import {
  createSubscription,
  getCustomerSubscriptions,
  getSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  updateDeliveryAddress,
  toggleAutoRenewal,
} from "../controllers/customerSubscriptionController.js";
import { authenticate, isCustomer } from "../middleware/authMiddleware.js";

const router = Router();

// All customer subscription routes are strictly authenticated for CUSTOMER role
router.use(authenticate, isCustomer);

// Subscriptions collection
router.route("/").post(createSubscription).get(getCustomerSubscriptions);

// Single subscription details
router.route("/:id").get(getSubscriptionById);

// Subscription lifecycle & management actions
router.patch("/:id/pause", pauseSubscription);
router.patch("/:id/resume", resumeSubscription);
router.patch("/:id/cancel", cancelSubscription);
router.patch("/:id/address", updateDeliveryAddress);
router.patch("/:id/auto-renew", toggleAutoRenewal);

export default router;

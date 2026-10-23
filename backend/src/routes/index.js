import { Router } from "express";
import adminAuthRoutes from "./adminAuthRoutes.js";
import adminManagementRoutes from "./adminManagementRoutes.js";
import customerAuthRoutes from "./customerAuthRoutes.js";
import providerAuthRoutes from "./providerAuthRoutes.js";
import providerMenuRoutes from "./providerMenuRoutes.js";
import providerPlanRoutes from "./providerPlanRoutes.js";
import providerSubscriptionRoutes from "./providerSubscriptionRoutes.js";
import providerCustomerRoutes from "./providerCustomerRoutes.js";
import providerOrderRoutes from "./providerOrderRoutes.js";
import providerSettingsRoutes from "./providerSettingsRoutes.js";
import publicKitchenRoutes from "./publicKitchenRoutes.js";
import customerSubscriptionRoutes from "./customerSubscriptionRoutes.js";
import customerAddressRoutes from "./customerAddressRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";

const router = Router();

// Admin Authentication & Management Routes
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin", adminAuthRoutes);
router.use("/admin", adminManagementRoutes);

// Customer Authentication & Account Routes
router.use("/customer/auth", customerAuthRoutes);
router.use("/customer", customerAuthRoutes);
router.use("/auth", customerAuthRoutes);

// Customer Address Book Routes
router.use("/customer/addresses", customerAddressRoutes);

// Customer Subscriptions & Meal Tracking
router.use("/customer/subscriptions", customerSubscriptionRoutes);
router.use("/subscriptions", customerSubscriptionRoutes);

// Provider Authentication & Onboarding Routes
router.use("/provider/auth", providerAuthRoutes);
router.use("/provider", providerAuthRoutes);

// Provider Weekly Menu Management
router.use("/provider/menu", providerMenuRoutes);

// Provider Tiffin Plans Management
router.use("/provider/plans", providerPlanRoutes);

// Provider Subscriptions Management
router.use("/provider/subscriptions", providerSubscriptionRoutes);

// Provider Customer Directory (CRM)
router.use("/provider/customers", providerCustomerRoutes);

// Provider Orders & Daily Dispatch Management
router.use("/provider/orders", providerOrderRoutes);

// Provider Settings & Security Preferences
router.use("/provider/settings", providerSettingsRoutes);

// Public Customer Kitchen Discovery & Menus
router.use("/kitchens", publicKitchenRoutes);
router.use("/providers", publicKitchenRoutes);

// Future modular route mounts:
// router.use("/auth", authRoutes);
// router.use("/providers", providerRoutes);
// router.use("/plans", planRoutes);
// router.use("/menus", menuRoutes);
// Customer & Provider Feedback & Reviews
router.use("/feedback", feedbackRoutes);

export default router;

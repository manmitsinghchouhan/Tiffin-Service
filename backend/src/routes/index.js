import { Router } from "express";
import adminAuthRoutes from "./adminAuthRoutes.js";
import adminManagementRoutes from "./adminManagementRoutes.js";
import customerAuthRoutes from "./customerAuthRoutes.js";
import providerAuthRoutes from "./providerAuthRoutes.js";

const router = Router();

// Admin Authentication & Management Routes
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin", adminAuthRoutes);
router.use("/admin", adminManagementRoutes);

// Customer Authentication & Account Routes
router.use("/customer/auth", customerAuthRoutes);
router.use("/customer", customerAuthRoutes);
router.use("/auth", customerAuthRoutes);

// Provider Authentication & Onboarding Routes
router.use("/provider/auth", providerAuthRoutes);
router.use("/provider", providerAuthRoutes);

// Future modular route mounts:
// router.use("/auth", authRoutes);
// router.use("/providers", providerRoutes);
// router.use("/plans", planRoutes);
// router.use("/menus", menuRoutes);
// router.use("/orders", orderRoutes);
// router.use("/subscriptions", subscriptionRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/feedback", feedbackRoutes);

export default router;

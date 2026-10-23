import { Router } from "express";
import {
  getProviderCustomerStats,
  getProviderCustomers,
  getProviderCustomerById,
} from "../controllers/providerCustomerController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All routes are strictly private to authenticated verified providers
router.use(authenticate, isProvider);

// KPI Stats endpoint (declared before /:id)
router.get("/stats", getProviderCustomerStats);

// Customer directory list with search, filter, and pagination
router.get("/", getProviderCustomers);

// Single customer 360-degree profile & history
router.get("/:id", getProviderCustomerById);

export default router;

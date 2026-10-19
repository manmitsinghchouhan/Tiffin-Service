import { Router } from "express";
import {
  getAdminDashboardStats,
  getAllProviders,
  getProviderById,
  verifyProvider,
  rejectProvider,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
} from "../controllers/adminManagementController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all admin management routes with Admin authentication
router.use(authenticate, isAdmin);

// Dashboard Summary & Activity Aggregations
router.get("/stats", getAdminDashboardStats);
router.get("/dashboard/stats", getAdminDashboardStats);

// Provider Approval & Management
router.get("/providers", getAllProviders);
router.get("/providers/:id", getProviderById);
router.patch("/providers/:id/verify", verifyProvider);
router.patch("/providers/:id/reject", rejectProvider);

// User & Customer Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

export default router;

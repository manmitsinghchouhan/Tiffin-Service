import { Router } from "express";
import {
  adminLogin,
  adminRegister,
  adminLogout,
  getAdminProfile,
} from "../controllers/adminAuthController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Public Admin Auth Routes
router.post("/register", adminRegister);
router.post("/login", adminLogin);
router.post("/logout", adminLogout);

// Protected Admin Auth Routes
router.get("/me", authenticate, isAdmin, getAdminProfile);

export default router;

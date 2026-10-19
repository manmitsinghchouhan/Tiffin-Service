import { Router } from "express";
import {
  completeOnboarding,
  getProviderProfile,
  providerLogin,
  providerLogout,
  providerRegister,
} from "../controllers/providerAuthController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// Public Provider Auth Routes
router.post("/register", providerRegister);
router.post("/login", providerLogin);
router.post("/logout", providerLogout);

// Protected Provider Routes (Requires PROVIDER role session)
router.get("/me", authenticate, isProvider, getProviderProfile);
router.post("/onboarding", authenticate, isProvider, completeOnboarding);
router.post("/profile", authenticate, isProvider, completeOnboarding);

export default router;

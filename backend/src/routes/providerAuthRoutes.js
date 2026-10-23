import { Router } from "express";
import {
  completeOnboarding,
  getProviderProfile,
  providerLogin,
  providerLogout,
  providerRegister,
  acknowledgeApproval,
  reapplyOnboarding,
  getProviderPublicPreview,
  updateBusinessProfile,
  toggleOperatingStatus,
} from "../controllers/providerAuthController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// Public Provider Auth Routes
router.post("/register", providerRegister);
router.post("/login", providerLogin);
router.post("/logout", providerLogout);

// Protected Provider Routes (Requires PROVIDER role session)
router.get("/me", authenticate, isProvider, getProviderProfile);
router.get("/preview", authenticate, isProvider, getProviderPublicPreview);
router.post("/onboarding", authenticate, isProvider, completeOnboarding);

// Business Profile Management (Identity, Visual Branding, Coverage & Operating Status)
router.get("/profile", authenticate, isProvider, getProviderProfile);
router.put("/profile", authenticate, isProvider, updateBusinessProfile);
router.patch("/profile/status", authenticate, isProvider, toggleOperatingStatus);

// Milestone Transition & Re-application
router.patch(
  "/acknowledge-approval",
  authenticate,
  isProvider,
  acknowledgeApproval,
);
router.patch("/reapply", authenticate, isProvider, reapplyOnboarding);

export default router;

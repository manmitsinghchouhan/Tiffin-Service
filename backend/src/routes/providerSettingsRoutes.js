import { Router } from "express";
import {
  getProviderSettings,
  updateProviderSettings,
  updateProviderPassword,
} from "../controllers/providerSettingsController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// All settings routes require authenticated PROVIDER role session
router.use(authenticate, isProvider);

router.route("/").get(getProviderSettings).put(updateProviderSettings);

router.put("/password", updateProviderPassword);

export default router;

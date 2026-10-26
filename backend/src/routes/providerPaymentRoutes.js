import { Router } from "express";
import {
  getProviderPayments,
  updatePaymentStatus,
} from "../controllers/providerPaymentController.js";
import { authenticate, isProvider } from "../middleware/authMiddleware.js";

const router = Router();

// Strictly authenticate for PROVIDER role
router.use(authenticate, isProvider);

router.route("/").get(getProviderPayments);
router.route("/:paymentId/status").patch(updatePaymentStatus);

export default router;

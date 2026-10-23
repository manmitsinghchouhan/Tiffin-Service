import { Router } from "express";
import {
  submitCustomerFeedback,
  getCustomerReviewForKitchen,
  getKitchenPublicReviews,
  getProviderFeedback,
} from "../controllers/feedbackController.js";
import {
  authenticate,
  isCustomer,
  isProvider,
} from "../middleware/authMiddleware.js";

const router = Router();

// Public: view reviews for a kitchen
router.get("/kitchen/:providerId", getKitchenPublicReviews);

// Provider: view kitchen's feedback & rating breakdown
router.get("/provider", authenticate, isProvider, getProviderFeedback);

// Customer: submit or view their own review
router.post("/", authenticate, isCustomer, submitCustomerFeedback);
router.get("/my-review/:providerId", authenticate, isCustomer, getCustomerReviewForKitchen);

export default router;

import { Router } from "express";
import {
  getSavedKitchens,
  toggleSavedKitchen,
  removeSavedKitchen,
} from "../controllers/customerSavedKitchenController.js";
import { authenticate, isCustomer } from "../middleware/authMiddleware.js";

const router = Router();

// Strictly authenticate for CUSTOMER role
router.use(authenticate, isCustomer);

router.route("/").get(getSavedKitchens);
router.route("/:kitchenId/toggle").post(toggleSavedKitchen);
router.route("/:kitchenId").delete(removeSavedKitchen);

export default router;

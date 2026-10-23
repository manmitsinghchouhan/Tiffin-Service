import { Router } from "express";
import {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/customerAddressController.js";
import { authenticate, isCustomer } from "../middleware/authMiddleware.js";

const router = Router();

// Strictly authenticate for CUSTOMER role
router.use(authenticate, isCustomer);

router.route("/").get(getAddresses).post(addAddress);
router.route("/:id").put(updateAddress).delete(deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;

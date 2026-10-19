import { Router } from "express";
import {
  customerLogin,
  customerLogout,
  customerRegister,
  getCustomerProfile,
} from "../controllers/customerAuthController.js";
import { authenticate, isCustomer } from "../middleware/authMiddleware.js";

const router = Router();

// Public Customer Auth Routes
router.post("/register", customerRegister);
router.post("/login", customerLogin);
router.post("/logout", customerLogout);

// Protected Customer Auth Routes
router.get("/me", authenticate, isCustomer, getCustomerProfile);

export default router;

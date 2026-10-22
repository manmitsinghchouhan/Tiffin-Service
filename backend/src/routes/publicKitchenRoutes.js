import { Router } from "express";
import {
  getPublicKitchens,
  getPublicCities,
  getPublicKitchenById,
} from "../controllers/publicKitchenController.js";

const router = Router();

// Public routes for guest & customer exploration (no authentication required)
router.get("/", getPublicKitchens);
router.get("/cities", getPublicCities);
router.get("/:id", getPublicKitchenById);

export default router;

import TiffinProvider from "../models/TiffinProvider.js";
import TiffinPlan from "../models/TiffinPlan.js";
import WeeklyMenu from "../models/WeeklyMenu.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { EMPTY_WEEKLY_MENU_TEMPLATE } from "./providerMenuController.js";

/**
 * @desc    Fetch all verified tiffin kitchens for public discovery
 * @route   GET /api/kitchens
 * @access  Public
 */
export const getPublicKitchens = asyncHandler(async (req, res) => {
  const { city, foodType, search, page = 1, limit = 12 } = req.query;

  const query = { verificationStatus: "VERIFIED" };

  // City filter (case-insensitive)
  if (city && city.trim().toLowerCase() !== "all") {
    query.city = { $regex: new RegExp(`^${city.trim()}$`, "i") };
  }

  // Food type filter (Veg, Non-Veg, Veg & Non-Veg)
  if (foodType && foodType.trim().toLowerCase() !== "all") {
    const normalizedType = foodType.trim().toUpperCase();
    if (normalizedType === "VEG") {
      query.foodType = { $in: ["VEG", "BOTH"] };
    } else if (normalizedType === "NON_VEG") {
      query.foodType = { $in: ["NON_VEG", "BOTH"] };
    } else if (normalizedType === "BOTH") {
      query.foodType = "BOTH";
    }
  }

  // Keyword search
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { businessName: searchRegex },
      { city: searchRegex },
      { address: searchRegex },
      { serviceArea: searchRegex },
      { description: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const totalKitchens = await TiffinProvider.countDocuments(query);
  const kitchens = await TiffinProvider.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Aggregate active plans for these kitchens in a single query
  const kitchenIds = kitchens.map((k) => k._id);
  const activePlans = await TiffinPlan.find({
    providerId: { $in: kitchenIds },
    status: "ACTIVE",
  }).lean();

  // Map plans to their respective providers
  const plansByProvider = {};
  for (const plan of activePlans) {
    const pid = String(plan.providerId);
    if (!plansByProvider[pid]) {
      plansByProvider[pid] = [];
    }
    plansByProvider[pid].push(plan);
  }

  // Enrich each kitchen with live plan highlights
  const enrichedKitchens = kitchens.map((k) => {
    const pid = String(k._id);
    const plans = plansByProvider[pid] || [];

    // Calculate lowest starting price and corresponding plan duration
    const validPlans = plans
      .filter((p) => typeof p.price === "number" && p.price >= 0)
      .sort((a, b) => a.price - b.price);

    const startingPrice = validPlans.length > 0 ? validPlans[0].price : null;
    const startingPlanDuration = validPlans.length > 0 ? validPlans[0].durationDays : null;

    // Determine available meal types offered across active plans
    const mealTypeSet = new Set();
    for (const plan of plans) {
      if (plan.mealType === "ALL_MEALS") {
        mealTypeSet.add("Breakfast");
        mealTypeSet.add("Lunch");
        mealTypeSet.add("Dinner");
      } else if (plan.mealType === "LUNCH_DINNER") {
        mealTypeSet.add("Lunch");
        mealTypeSet.add("Dinner");
      } else if (plan.mealType === "BREAKFAST") {
        mealTypeSet.add("Breakfast");
      } else if (plan.mealType === "LUNCH") {
        mealTypeSet.add("Lunch");
      } else if (plan.mealType === "DINNER") {
        mealTypeSet.add("Dinner");
      }
    }

    const availableMeals =
      mealTypeSet.size > 0 ? Array.from(mealTypeSet) : ["Lunch", "Dinner"];

    return {
      ...k,
      plansCount: plans.length,
      startingPrice,
      startingPlanDuration,
      availableMeals,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedKitchens.length,
    total: totalKitchens,
    page: pageNum,
    pages: Math.ceil(totalKitchens / limitNum) || 1,
    data: enrichedKitchens,
  });
});

/**
 * @desc    Fetch distinct cities where verified kitchens operate
 * @route   GET /api/kitchens/cities
 * @access  Public
 */
export const getPublicCities = asyncHandler(async (req, res) => {
  const rawCities = await TiffinProvider.distinct("city", {
    verificationStatus: "VERIFIED",
  });

  const cleanedCities = rawCities
    .filter((c) => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim())
    .sort();

  const uniqueCities = Array.from(new Set(cleanedCities));

  res.status(200).json({
    success: true,
    data: uniqueCities,
  });
});

/**
 * @desc    Fetch single kitchen details with active plans and weekly menu
 * @route   GET /api/kitchens/:id
 * @access  Public
 */
export const getPublicKitchenById = asyncHandler(async (req, res) => {
  const kitchen = await TiffinProvider.findOne({
    _id: req.params.id,
    verificationStatus: "VERIFIED",
  }).lean();

  if (!kitchen) {
    throw new ApiError(404, "Verified kitchen profile not found");
  }

  // Concurrently fetch active plans and weekly menu
  const [plans, weeklyMenuDoc] = await Promise.all([
    TiffinPlan.find({ providerId: kitchen._id, status: "ACTIVE" })
      .sort({ price: 1 })
      .lean(),
    WeeklyMenu.findOne({ providerId: kitchen._id }).lean(),
  ]);

  // Clean format for weekly menu
  const weeklyMenu = {};
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (const day of DAYS) {
    weeklyMenu[day] = weeklyMenuDoc?.[day] || EMPTY_WEEKLY_MENU_TEMPLATE[day];
  }

  res.status(200).json({
    success: true,
    data: {
      kitchen,
      plans,
      weeklyMenu,
    },
  });
});

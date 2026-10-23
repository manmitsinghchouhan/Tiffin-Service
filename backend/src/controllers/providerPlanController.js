import TiffinPlan from "../models/TiffinPlan.js";
import TiffinProvider from "../models/TiffinProvider.js";
import Subscription from "../models/Subscription.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Helper to fetch the authenticated provider profile
 */
const getAuthenticatedProvider = async (userId) => {
  const provider = await TiffinProvider.findOne({ userId });
  if (!provider) {
    throw new ApiError(404, "Tiffin provider profile not found for this account");
  }
  return provider;
};

/**
 * @desc    Fetch all plans created by the authenticated provider
 * @route   GET /api/provider/plans
 * @access  Private (Provider only)
 */
export const getProviderPlans = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { status, diet, mealType } = req.query;

  const query = { providerId: provider._id };

  if (status && ["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
    query.status = status.toUpperCase();
  }

  if (diet && ["VEG", "NON_VEG", "BOTH"].includes(diet.toUpperCase())) {
    query.diet = diet.toUpperCase();
  }

  if (mealType && ["BREAKFAST", "LUNCH", "DINNER", "LUNCH_DINNER", "ALL_MEALS"].includes(mealType.toUpperCase())) {
    query.mealType = mealType.toUpperCase();
  }

  const plans = await TiffinPlan.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

/**
 * @desc    Get a single plan by ID
 * @route   GET /api/provider/plans/:id
 * @access  Private (Provider only)
 */
export const getProviderPlanById = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const plan = await TiffinPlan.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!plan) {
    throw new ApiError(404, "Tiffin plan not found or does not belong to this kitchen");
  }

  res.status(200).json({
    success: true,
    data: plan,
  });
});

/**
 * @desc    Create a new Tiffin Plan
 * @route   POST /api/provider/plans
 * @access  Private (Provider only)
 */
export const createProviderPlan = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const {
    name,
    description,
    durationDays,
    mealType,
    diet,
    deliveryDays,
    features,
    imageUrl,
    price,
    isSubscriptionAvailable,
    status,
    mealsPerDay,
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Plan name is required");
  }

  if (price === undefined || price === null || Number(price) < 0) {
    throw new ApiError(400, "Valid price is required (cannot be negative)");
  }

  const parsedDuration = Number(durationDays) || 30;
  if (parsedDuration < 1) {
    throw new ApiError(400, "Duration must be at least 1 day");
  }

  // Automatic calculation of mealsPerDay if not provided
  let calculatedMealsPerDay = Number(mealsPerDay) || 1;
  const normalizedMealType = (mealType || "LUNCH").toUpperCase().trim();
  if (!mealsPerDay) {
    if (normalizedMealType === "LUNCH_DINNER") calculatedMealsPerDay = 2;
    else if (normalizedMealType === "ALL_MEALS") calculatedMealsPerDay = 3;
    else calculatedMealsPerDay = 1;
  }

  const sanitizedFeatures = Array.isArray(features)
    ? features.map((f) => String(f).trim()).filter((f) => f.length > 0)
    : [];

  // Enforce dietary constraint based on provider registration
  let resolvedDiet = (diet || "VEG").toUpperCase().trim();
  if (provider.foodType === "VEG") {
    resolvedDiet = "VEG";
  } else if (provider.foodType === "NON_VEG") {
    resolvedDiet = "NON_VEG";
  } else if (provider.foodType === "BOTH") {
    if (!["VEG", "NON_VEG", "BOTH"].includes(resolvedDiet)) {
      resolvedDiet = "VEG";
    }
  }

  const newPlan = await TiffinPlan.create({
    providerId: provider._id,
    name: name.trim(),
    description: (description || "").trim(),
    durationDays: parsedDuration,
    mealsPerDay: calculatedMealsPerDay,
    mealType: normalizedMealType,
    diet: resolvedDiet,
    deliveryDays: (deliveryDays || "ALL_DAYS").toUpperCase().trim(),
    features: sanitizedFeatures,
    imageUrl: (imageUrl || "").trim(),
    price: Number(price),
    isSubscriptionAvailable: isSubscriptionAvailable !== false,
    status: (status || "ACTIVE").toUpperCase().trim(),
  });

  res.status(201).json({
    success: true,
    message: "Tiffin plan created successfully",
    data: newPlan,
  });
});

/**
 * @desc    Update an existing Tiffin Plan
 * @route   PATCH /api/provider/plans/:id
 * @access  Private (Provider only)
 */
export const updateProviderPlan = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const plan = await TiffinPlan.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!plan) {
    throw new ApiError(404, "Tiffin plan not found or does not belong to this kitchen");
  }

  const {
    name,
    description,
    durationDays,
    mealType,
    diet,
    deliveryDays,
    features,
    imageUrl,
    price,
    isSubscriptionAvailable,
    status,
    mealsPerDay,
  } = req.body;

  if (name !== undefined) plan.name = name.trim();
  if (description !== undefined) plan.description = description.trim();
  if (imageUrl !== undefined) plan.imageUrl = imageUrl.trim();
  if (durationDays !== undefined) {
    const d = Number(durationDays);
    if (d < 1) throw new ApiError(400, "Duration must be at least 1 day");
    plan.durationDays = d;
  }
  if (price !== undefined) {
    const p = Number(price);
    if (p < 0) throw new ApiError(400, "Price cannot be negative");
    plan.price = p;
  }
  if (mealType !== undefined) plan.mealType = mealType.toUpperCase().trim();
  if (diet !== undefined) {
    let resolvedDiet = diet.toUpperCase().trim();
    if (provider.foodType === "VEG") {
      resolvedDiet = "VEG";
    } else if (provider.foodType === "NON_VEG") {
      resolvedDiet = "NON_VEG";
    } else if (!["VEG", "NON_VEG", "BOTH"].includes(resolvedDiet)) {
      resolvedDiet = "VEG";
    }
    plan.diet = resolvedDiet;
  }
  if (deliveryDays !== undefined) plan.deliveryDays = deliveryDays.toUpperCase().trim();
  if (status !== undefined) plan.status = status.toUpperCase().trim();
  if (isSubscriptionAvailable !== undefined) plan.isSubscriptionAvailable = Boolean(isSubscriptionAvailable);
  if (mealsPerDay !== undefined) plan.mealsPerDay = Math.max(1, Number(mealsPerDay) || 1);

  if (Array.isArray(features)) {
    plan.features = features.map((f) => String(f).trim()).filter((f) => f.length > 0);
  }

  await plan.save();

  res.status(200).json({
    success: true,
    message: "Tiffin plan updated successfully",
    data: plan,
  });
});

/**
 * @desc    Quick toggle plan status between ACTIVE and INACTIVE
 * @route   PATCH /api/provider/plans/:id/toggle-status
 * @access  Private (Provider only)
 */
export const togglePlanStatus = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const plan = await TiffinPlan.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!plan) {
    throw new ApiError(404, "Tiffin plan not found or does not belong to this kitchen");
  }

  plan.status = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await plan.save();

  res.status(200).json({
    success: true,
    message: `Plan marked as ${plan.status}`,
    data: plan,
  });
});

/**
 * @desc    Delete or safely archive a plan
 * @route   DELETE /api/provider/plans/:id
 * @access  Private (Provider only)
 */
export const deleteProviderPlan = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const plan = await TiffinPlan.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!plan) {
    throw new ApiError(404, "Tiffin plan not found or does not belong to this kitchen");
  }

  // Safety check: Are there active customer subscriptions using this plan?
  const activeSubsCount = await Subscription.countDocuments({
    planId: plan._id,
    status: "ACTIVE",
  });

  if (activeSubsCount > 0) {
    // Cannot hard delete because active customers rely on it. Archive instead.
    plan.status = "INACTIVE";
    await plan.save();

    return res.status(200).json({
      success: true,
      message: `Plan has ${activeSubsCount} active subscriber(s). It has been deactivated and archived instead of permanently deleted.`,
      isArchived: true,
      data: plan,
    });
  }

  await TiffinPlan.deleteOne({ _id: plan._id });

  res.status(200).json({
    success: true,
    message: "Tiffin plan deleted successfully",
  });
});

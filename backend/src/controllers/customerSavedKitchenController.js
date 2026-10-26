import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import TiffinProvider from "../models/TiffinProvider.js";
import TiffinPlan from "../models/TiffinPlan.js";
import Feedback from "../models/Feedback.js";

/**
 * @desc    Get all saved kitchens for the logged-in customer
 * @route   GET /api/customer/saved-kitchens
 * @access  Private (Customer only)
 */
export const getSavedKitchens = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("savedKitchens");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const savedIds = user.savedKitchens || [];
  if (savedIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      savedKitchenIds: [],
    });
  }

  // Fetch kitchen details for all saved kitchen IDs
  const kitchens = await TiffinProvider.find({
    _id: { $in: savedIds },
  }).lean();

  const kitchenIds = kitchens.map((k) => k._id);

  // Fetch active plans for pricing & plan counts
  const activePlans = await TiffinPlan.find({
    providerId: { $in: kitchenIds },
    status: "ACTIVE",
  }).lean();

  const plansByProvider = {};
  for (const plan of activePlans) {
    const pid = String(plan.providerId);
    if (!plansByProvider[pid]) {
      plansByProvider[pid] = [];
    }
    plansByProvider[pid].push(plan);
  }

  // Fetch ratings/feedback summaries for these kitchens
  const feedbackAgg = await Feedback.aggregate([
    { $match: { providerId: { $in: kitchenIds } } },
    {
      $group: {
        _id: "$providerId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const feedbackByProvider = {};
  for (const fb of feedbackAgg) {
    feedbackByProvider[String(fb._id)] = {
      avgRating: Number(fb.avgRating.toFixed(1)),
      reviewCount: fb.reviewCount,
    };
  }

  // Preserve user's saved ordering (most recently added first)
  const savedIdStrings = savedIds.map((id) => id.toString());
  
  const enrichedKitchens = kitchens
    .map((k) => {
      const pid = String(k._id);
      const plans = plansByProvider[pid] || [];
      const fb = feedbackByProvider[pid] || { avgRating: 4.8, reviewCount: 0 };
      const minPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : 0;

      return {
        ...k,
        activePlanCount: plans.length,
        minPrice,
        rating: fb.avgRating,
        reviewCount: fb.reviewCount,
        samplePlans: plans.slice(0, 3).map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          mealType: p.mealType,
          diet: p.diet,
          durationDays: p.durationDays,
        })),
      };
    })
    .sort((a, b) => {
      return savedIdStrings.indexOf(b._id.toString()) - savedIdStrings.indexOf(a._id.toString());
    });

  res.status(200).json({
    success: true,
    data: enrichedKitchens,
    savedKitchenIds: savedIdStrings,
  });
});

/**
 * @desc    Toggle a kitchen in customer's saved list (favorite/unfavorite)
 * @route   POST /api/customer/saved-kitchens/:kitchenId/toggle
 * @access  Private (Customer only)
 */
export const toggleSavedKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(kitchenId)) {
    return res.status(400).json({ success: false, message: "Invalid kitchen ID" });
  }

  const kitchen = await TiffinProvider.findById(kitchenId).select("businessName");
  if (!kitchen) {
    return res.status(404).json({ success: false, message: "Kitchen not found" });
  }

  const user = await User.findById(req.user._id).select("savedKitchens");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const alreadySaved = (user.savedKitchens || []).some(
    (id) => id.toString() === kitchenId
  );

  let updatedUser;
  let isSaved = false;

  if (alreadySaved) {
    updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedKitchens: kitchenId } },
      { new: true }
    ).select("savedKitchens");
    isSaved = false;
  } else {
    updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedKitchens: kitchenId } },
      { new: true }
    ).select("savedKitchens");
    isSaved = true;
  }

  const savedKitchenIds = (updatedUser?.savedKitchens || []).map((id) => id.toString());

  res.status(200).json({
    success: true,
    isSaved,
    message: isSaved
      ? `"${kitchen.businessName}" added to your saved kitchens!`
      : `"${kitchen.businessName}" removed from your saved kitchens.`,
    savedKitchenIds,
  });
});

/**
 * @desc    Remove a kitchen from saved kitchens list
 * @route   DELETE /api/customer/saved-kitchens/:kitchenId
 * @access  Private (Customer only)
 */
export const removeSavedKitchen = asyncHandler(async (req, res) => {
  const { kitchenId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(kitchenId)) {
    return res.status(400).json({ success: false, message: "Invalid kitchen ID" });
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedKitchens: kitchenId } },
    { new: true }
  ).select("savedKitchens");

  const savedKitchenIds = (updatedUser?.savedKitchens || []).map((id) => id.toString());

  res.status(200).json({
    success: true,
    message: "Kitchen removed from saved kitchens",
    savedKitchenIds,
  });
});

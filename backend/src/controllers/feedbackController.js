import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";
import TiffinProvider from "../models/TiffinProvider.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Helper: Recalculates average rating and review count for a provider,
 * and updates the provider document.
 */
export const updateKitchenRatingStats = async (providerId) => {
  const pId = new mongoose.Types.ObjectId(providerId);

  const stats = await Feedback.aggregate([
    {
      $match: {
        providerId: pId,
        rating: { $exists: true, $ne: null, $gte: 1, $lte: 5 },
      },
    },
    {
      $group: {
        _id: "$providerId",
        avgRating: { $avg: "$rating" },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const avgRating =
    stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const totalCount = stats.length > 0 ? stats[0].totalCount : 0;

  await TiffinProvider.findByIdAndUpdate(providerId, {
    rating: avgRating,
    reviewsCount: totalCount,
  });

  return { avgRating, totalCount };
};

/**
 * @desc    Submit or update customer review and star rating for a provider
 * @route   POST /api/feedback
 * @access  Private (Customer only)
 */
export const submitCustomerFeedback = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { providerId, rating, review, type = "FEEDBACK", orderId } = req.body;

  if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
    throw new ApiError(400, "Valid provider ID is required");
  }

  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, "Rating must be a number between 1 and 5");
  }

  const kitchen = await TiffinProvider.findById(providerId);
  if (!kitchen) {
    throw new ApiError(404, "Tiffin service kitchen not found");
  }

  // Upsert feedback: 1 review per customer per kitchen
  const updateData = {
    customerId,
    providerId,
    rating: numericRating,
    review: typeof review === "string" ? review.trim() : "",
    type: ["FEEDBACK", "COMPLAINT"].includes(type) ? type : "FEEDBACK",
  };

  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    updateData.orderId = orderId;
  }

  const feedback = await Feedback.findOneAndUpdate(
    { customerId, providerId },
    { $set: updateData },
    { upsert: true, new: true, runValidators: true }
  ).populate("customerId", "name");

  // Re-calculate live stats for the kitchen
  const updatedStats = await updateKitchenRatingStats(providerId);

  res.status(200).json({
    success: true,
    message: "Feedback submitted successfully!",
    data: {
      feedback,
      kitchenRating: updatedStats.avgRating,
      kitchenReviewsCount: updatedStats.totalCount,
    },
  });
});

/**
 * @desc    Get the authenticated customer's own review for a specific kitchen
 * @route   GET /api/feedback/my-review/:providerId
 * @access  Private (Customer only)
 */
export const getCustomerReviewForKitchen = asyncHandler(async (req, res) => {
  const customerId = req.user._id;
  const { providerId } = req.params;

  if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
    throw new ApiError(400, "Valid provider ID is required");
  }

  const feedback = await Feedback.findOne({ customerId, providerId }).populate(
    "customerId",
    "name"
  );

  res.status(200).json({
    success: true,
    data: feedback || null,
  });
});

/**
 * @desc    Get public reviews for a specific kitchen (for public cards/detail modal)
 * @route   GET /api/feedback/kitchen/:providerId
 * @access  Public
 */
export const getKitchenPublicReviews = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
    throw new ApiError(400, "Valid provider ID is required");
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, totalCount, kitchen] = await Promise.all([
    Feedback.find({ providerId })
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Feedback.countDocuments({ providerId }),
    TiffinProvider.findById(providerId).select("rating reviewsCount businessName").lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      rating: kitchen?.rating || 0,
      totalReviews: totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum) || 1,
    },
  });
});

/**
 * @desc    Get all reviews and rating breakdown for the logged-in kitchen provider
 * @route   GET /api/feedback/provider
 * @access  Private (Provider only)
 */
export const getProviderFeedback = asyncHandler(async (req, res) => {
  const provider = await TiffinProvider.findOne({ userId: req.user._id });
  if (!provider) {
    throw new ApiError(404, "Kitchen profile not found for this provider account");
  }

  const providerId = provider._id;
  const { ratingFilter } = req.query; // 'ALL', '5', '4', '3', '2', '1'

  // Build query
  const query = { providerId };
  if (ratingFilter && ratingFilter !== "ALL") {
    const num = parseInt(ratingFilter, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      query.rating = num;
    }
  }

  // Fetch reviews matching filter
  const reviews = await Feedback.find(query)
    .populate("customerId", "name email phone")
    .sort({ createdAt: -1 })
    .lean();

  // Aggregate breakdown across all reviews for this kitchen
  const aggregateStats = await Feedback.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let totalRatingSum = 0;

  for (const item of aggregateStats) {
    const r = Math.round(item._id);
    if (r >= 1 && r <= 5) {
      breakdown[r] = item.count;
      totalReviews += item.count;
      totalRatingSum += r * item.count;
    }
  }

  const averageRating =
    totalReviews > 0 ? Math.round((totalRatingSum / totalReviews) * 10) / 10 : 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        averageRating,
        totalReviews,
        breakdown,
      },
      reviews,
    },
  });
});

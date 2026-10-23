import Subscription from "../models/Subscription.js";
import Order from "../models/Order.js";
import TiffinProvider from "../models/TiffinProvider.js";
import User from "../models/User.js";
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
 * @desc    Get aggregate subscription KPI stats for the provider dashboard
 * @route   GET /api/provider/subscriptions/stats
 * @access  Private (Provider only)
 */
export const getProviderSubscriptionStats = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    totalSubscribers,
    activeCount,
    pausedCount,
    expiringSoonCount,
    revenueAgg,
  ] = await Promise.all([
    // Total all-time subscriptions
    Subscription.countDocuments({ providerId: provider._id }),

    // Currently active subscribers receiving daily meals
    Subscription.countDocuments({ providerId: provider._id, status: "ACTIVE" }),

    // Subscriptions on temporary hold
    Subscription.countDocuments({ providerId: provider._id, status: "PAUSED" }),

    // Subscriptions expiring within the next 3 days
    Subscription.countDocuments({
      providerId: provider._id,
      status: "ACTIVE",
      endDate: { $gte: now, $lte: threeDaysFromNow },
    }),

    // Revenue from currently active subscriptions
    Subscription.aggregate([
      {
        $match: {
          providerId: provider._id,
          status: "ACTIVE",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const activeRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: {
      totalSubscribers,
      activeCount,
      pausedCount,
      expiringSoonCount,
      activeRevenue,
    },
  });
});

/**
 * @desc    Fetch subscriptions for the authenticated provider with search, filters & pagination
 * @route   GET /api/provider/subscriptions
 * @access  Private (Provider only)
 */
export const getProviderSubscriptions = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { status, planId, search, page = 1, limit = 20 } = req.query;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const query = { providerId: provider._id };

  // Status Filter
  if (status && status.trim().toUpperCase() !== "ALL") {
    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus === "EXPIRING") {
      query.status = "ACTIVE";
      query.endDate = { $gte: now, $lte: threeDaysFromNow };
    } else if (["ACTIVE", "PAUSED", "EXPIRED", "CANCELLED"].includes(normalizedStatus)) {
      query.status = normalizedStatus;
    }
  }

  // Plan Filter
  if (planId && planId.trim() !== "ALL") {
    query.planId = planId.trim();
  }

  // Search Filter (Customer name/phone or delivery address or plan name)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    // Match customer accounts by name, email, or phone
    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ],
    }).select("_id");

    const userIds = matchingUsers.map((u) => u._id);

    query.$or = [
      { customerId: { $in: userIds } },
      { "deliveryAddress.street": searchRegex },
      { "deliveryAddress.city": searchRegex },
      { "deliveryAddress.landmark": searchRegex },
      { "deliveryAddress.contactPhone": searchRegex },
      { "planSnapshot.name": searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const total = await Subscription.countDocuments(query);
  const subscriptions = await Subscription.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate("customerId", "name email phone")
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  // Enrich each subscription with live operational metrics
  const enrichedSubscriptions = subscriptions.map((sub) => {
    const subObj = sub.toObject();
    const end = new Date(sub.endDate);
    const start = new Date(sub.startDate);

    const diffEndMs = end - now;
    const remainingDays =
      sub.status === "ACTIVE"
        ? Math.max(0, Math.ceil(diffEndMs / (1000 * 60 * 60 * 24)))
        : sub.status === "PAUSED" && sub.pausedAt
        ? Math.max(0, Math.ceil((end - new Date(sub.pausedAt)) / (1000 * 60 * 60 * 24)))
        : 0;

    const daysDelivered = Math.max(
      0,
      Math.floor((now - start) / (1000 * 60 * 60 * 24))
    );

    const isExpiringSoon = sub.status === "ACTIVE" && remainingDays <= 3;

    return {
      ...subObj,
      remainingDays,
      daysDelivered,
      isExpiringSoon,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedSubscriptions.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: enrichedSubscriptions,
  });
});

/**
 * @desc    Get detailed subscription record for provider inspection
 * @route   GET /api/provider/subscriptions/:id
 * @access  Private (Provider only)
 */
export const getProviderSubscriptionById = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const subscription = await Subscription.findOne({
    _id: req.params.id,
    providerId: provider._id,
  })
    .populate("customerId", "name email phone")
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  if (!subscription) {
    throw new ApiError(404, "Subscription not found for this kitchen");
  }

  const now = new Date();
  const end = new Date(subscription.endDate);
  const start = new Date(subscription.startDate);

  const remainingDays =
    subscription.status === "ACTIVE"
      ? Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
      : 0;

  const daysDelivered = Math.max(
    0,
    Math.floor((now - start) / (1000 * 60 * 60 * 24))
  );

  res.status(200).json({
    success: true,
    data: {
      ...subscription.toObject(),
      remainingDays,
      daysDelivered,
      isExpiringSoon: subscription.status === "ACTIVE" && remainingDays <= 3,
    },
  });
});

/**
 * @desc    Pause a customer's active subscription on request
 * @route   PATCH /api/provider/subscriptions/:id/pause
 * @access  Private (Provider only)
 */
export const pauseProviderSubscription = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const subscription = await Subscription.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found for this kitchen");
  }

  if (subscription.status !== "ACTIVE") {
    throw new ApiError(
      400,
      `Cannot pause subscription with status '${subscription.status}'. Only ACTIVE subscriptions can be paused.`
    );
  }

  subscription.status = "PAUSED";
  subscription.pausedAt = new Date();
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription deliveries put on hold (PAUSED).",
    data: subscription,
  });
});

/**
 * @desc    Resume a customer's paused subscription
 * @route   PATCH /api/provider/subscriptions/:id/resume
 * @access  Private (Provider only)
 */
export const resumeProviderSubscription = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const subscription = await Subscription.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found for this kitchen");
  }

  if (subscription.status !== "PAUSED") {
    throw new ApiError(
      400,
      `Cannot resume subscription with status '${subscription.status}'. Only PAUSED subscriptions can be resumed.`
    );
  }

  if (subscription.pausedAt) {
    const pausedDurationMs =
      Date.now() - new Date(subscription.pausedAt).getTime();
    subscription.endDate = new Date(
      new Date(subscription.endDate).getTime() + pausedDurationMs
    );
  }

  subscription.status = "ACTIVE";
  subscription.pausedAt = null;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription deliveries resumed successfully (ACTIVE).",
    data: subscription,
  });
});

/**
 * @desc    Cancel a customer's subscription
 * @route   PATCH /api/provider/subscriptions/:id/cancel
 * @access  Private (Provider only)
 */
export const cancelProviderSubscription = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { reason } = req.body;

  const subscription = await Subscription.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found for this kitchen");
  }

  if (["CANCELLED", "EXPIRED"].includes(subscription.status)) {
    throw new ApiError(
      400,
      `Subscription is already ${subscription.status.toLowerCase()}.`
    );
  }

  const finalReason =
    (reason && typeof reason === "string" && reason.trim()) ||
    "Kitchen reached maximum cooking capacity";

  subscription.status = "CANCELLED";
  subscription.autoRenewal = false;
  subscription.cancellationReason = finalReason;
  subscription.cancelledBy = "PROVIDER";
  subscription.cancelledAt = new Date();
  await subscription.save();

  // Synchronize linked Order record(s) so Commercial Order Ledger reflects CANCELLED
  await Order.updateMany(
    { subscriptionId: subscription._id },
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: finalReason,
        cancelledBy: "PROVIDER",
        cancelledAt: new Date(),
      },
    }
  );

  res.status(200).json({
    success: true,
    message: "Subscription and associated order have been cancelled.",
    data: subscription,
  });
});

/**
 * @desc    Update delivery address & instructions for a subscription
 * @route   PATCH /api/provider/subscriptions/:id/address
 * @access  Private (Provider only)
 */
export const updateProviderSubscriptionAddress = asyncHandler(
  async (req, res) => {
    const provider = await getAuthenticatedProvider(req.user._id);

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      providerId: provider._id,
    });

    if (!subscription) {
      throw new ApiError(404, "Subscription not found for this kitchen");
    }

    const {
      street,
      city,
      state,
      postalCode,
      landmark,
      contactPhone,
      notes,
    } = req.body;

    if (street !== undefined) subscription.deliveryAddress.street = street.trim();
    if (city !== undefined) subscription.deliveryAddress.city = city.trim();
    if (state !== undefined) subscription.deliveryAddress.state = state.trim();
    if (postalCode !== undefined)
      subscription.deliveryAddress.postalCode = postalCode.trim();
    if (landmark !== undefined)
      subscription.deliveryAddress.landmark = landmark ? landmark.trim() : "";
    if (contactPhone !== undefined)
      subscription.deliveryAddress.contactPhone = contactPhone.trim();
    if (notes !== undefined)
      subscription.notes = notes ? notes.trim() : "";

    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Delivery details updated successfully.",
      data: subscription,
    });
  }
);

import Subscription from "../models/Subscription.js";
import TiffinPlan from "../models/TiffinPlan.js";
import TiffinProvider from "../models/TiffinProvider.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Create a new customer subscription to a tiffin plan
 * @route   POST /api/customer/subscriptions
 * @access  Private (Customer only)
 */
export const createSubscription = asyncHandler(async (req, res) => {
  const { planId, startDate, deliveryAddress, autoRenewal, notes } = req.body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required to subscribe");
  }

  // 1. Verify delivery address completeness
  if (
    !deliveryAddress ||
    !deliveryAddress.street?.trim() ||
    !deliveryAddress.city?.trim()
  ) {
    throw new ApiError(
      400,
      "Please provide a complete delivery address with street and city",
    );
  }

  // 2. Fetch the plan and verify it is active
  const plan = await TiffinPlan.findById(planId);
  if (!plan) {
    throw new ApiError(404, "Selected tiffin plan not found");
  }

  if (plan.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "This tiffin plan is currently inactive and unavailable",
    );
  }

  // 3. Verify kitchen provider is verified and active
  const provider = await TiffinProvider.findById(plan.providerId);
  if (!provider || provider.verificationStatus !== "VERIFIED") {
    throw new ApiError(
      400,
      "This kitchen is currently not verified or inactive",
    );
  }

  // 4. Calculate subscription start and end dates
  const now = new Date();
  let parsedStartDate = startDate ? new Date(startDate) : new Date();

  // If parsed date is invalid, default to today/tomorrow
  if (isNaN(parsedStartDate.getTime())) {
    parsedStartDate = new Date();
  }

  // Ensure start date cannot be in the past (allow current day with grace)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsedStartDate < startOfDay) {
    parsedStartDate = startOfDay;
  }

  const durationDays = Number(plan.durationDays) || 30;
  const endDate = new Date(
    parsedStartDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
  );

  // 5. Build immutable plan snapshot
  const planSnapshot = {
    name: plan.name,
    price: plan.price,
    durationDays: plan.durationDays,
    mealsPerDay: plan.mealsPerDay || 1,
    mealType: plan.mealType || "LUNCH",
    diet: plan.diet || "VEG",
    deliveryDays: plan.deliveryDays || "ALL_DAYS",
    features: plan.features || [],
  };

  const finalDeliveryAddress = {
    street: deliveryAddress.street.trim(),
    city: deliveryAddress.city.trim(),
    state: deliveryAddress.state?.trim() || "",
    postalCode: deliveryAddress.postalCode?.trim() || "",
    landmark: deliveryAddress.landmark?.trim() || "",
    contactPhone: (
      deliveryAddress.contactPhone ||
      req.user.phone ||
      ""
    ).trim(),
  };

  // 6. Create Subscription record
  const subscription = await Subscription.create({
    customerId: req.user._id,
    providerId: plan.providerId,
    planId: plan._id,
    startDate: parsedStartDate,
    endDate,
    totalAmount: plan.price,
    planSnapshot,
    deliveryAddress: finalDeliveryAddress,
    autoRenewal: plan.isSubscriptionAvailable ? Boolean(autoRenewal) : false,
    notes: (notes || "").trim(),
    status: "ACTIVE",
  });

  // 7. Create initial linked Order record for provider tracking
  await Order.create({
    customerId: req.user._id,
    providerId: plan.providerId,
    planId: plan._id,
    subscriptionId: subscription._id,
    quantity: 1,
    totalAmount: plan.price,
    planSnapshot,
    deliveryAddress: finalDeliveryAddress,
    status: "ACCEPTED",
    notes: subscription.notes || `Subscription #${subscription._id}`,
  });

  // 8. Populate provider info before responding
  const populatedSubscription = await Subscription.findById(subscription._id)
    .populate(
      "providerId",
      "businessName city address phone imageUrl foodType serviceArea rating",
    )
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  res.status(201).json({
    success: true,
    message: "Subscribed successfully! Your meal deliveries will begin on schedule.",
    data: populatedSubscription,
  });
});

/**
 * @desc    Get all subscriptions for logged-in customer
 * @route   GET /api/customer/subscriptions
 * @access  Private (Customer only)
 */
export const getCustomerSubscriptions = asyncHandler(async (req, res) => {
  const query = { customerId: req.user._id };

  if (req.query.status) {
    query.status = req.query.status.toUpperCase();
  }

  const subscriptions = await Subscription.find(query)
    .sort({ createdAt: -1 })
    .populate(
      "providerId",
      "businessName city address phone imageUrl foodType serviceArea rating",
    )
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  const now = new Date();

  // Enforce dynamic status updates & enrich remaining days
  const enrichedSubscriptions = subscriptions.map((sub) => {
    const subObj = sub.toObject();
    const end = new Date(sub.endDate);
    const diffMs = end - now;
    const remainingDays =
      sub.status === "ACTIVE"
        ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        : 0;

    return {
      ...subObj,
      remainingDays,
      isExpiringSoon: sub.status === "ACTIVE" && remainingDays <= 3,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedSubscriptions.length,
    data: enrichedSubscriptions,
  });
});

/**
 * @desc    Get single subscription details
 * @route   GET /api/customer/subscriptions/:id
 * @access  Private (Customer only)
 */
export const getSubscriptionById = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  })
    .populate(
      "providerId",
      "businessName city address phone imageUrl foodType serviceArea rating",
    )
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  const now = new Date();
  const end = new Date(subscription.endDate);
  const diffMs = end - now;
  const remainingDays =
    subscription.status === "ACTIVE"
      ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      : 0;

  res.status(200).json({
    success: true,
    data: {
      ...subscription.toObject(),
      remainingDays,
      isExpiringSoon: subscription.status === "ACTIVE" && remainingDays <= 3,
    },
  });
});

/**
 * @desc    Pause an active subscription (e.g., customer traveling/vacation)
 * @route   PATCH /api/customer/subscriptions/:id/pause
 * @access  Private (Customer only)
 */
export const pauseSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "ACTIVE") {
    throw new ApiError(
      400,
      `Cannot pause subscription with status '${subscription.status}'. Only ACTIVE subscriptions can be paused.`,
    );
  }

  subscription.status = "PAUSED";
  subscription.pausedAt = new Date();
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription paused. Meal deliveries have been temporarily put on hold.",
    data: subscription,
  });
});

/**
 * @desc    Resume a paused subscription (shifts endDate forward by paused duration)
 * @route   PATCH /api/customer/subscriptions/:id/resume
 * @access  Private (Customer only)
 */
export const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "PAUSED") {
    throw new ApiError(
      400,
      `Cannot resume subscription with status '${subscription.status}'. Only PAUSED subscriptions can be resumed.`,
    );
  }

  // Extend the subscription end date by the exact time it was paused
  if (subscription.pausedAt) {
    const pausedDurationMs = Math.max(
      0,
      Date.now() - new Date(subscription.pausedAt).getTime(),
    );
    subscription.endDate = new Date(
      new Date(subscription.endDate).getTime() + pausedDurationMs,
    );
  }

  subscription.status = "ACTIVE";
  subscription.pausedAt = null;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription resumed! Your meal deliveries will continue as planned.",
    data: subscription,
  });
});

/**
 * @desc    Cancel an active or paused subscription
 * @route   PATCH /api/customer/subscriptions/:id/cancel
 * @access  Private (Customer only)
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (
    subscription.status === "CANCELLED" ||
    subscription.status === "EXPIRED"
  ) {
    throw new ApiError(
      400,
      `Subscription is already ${subscription.status.toLowerCase()}`,
    );
  }

  subscription.status = "CANCELLED";
  subscription.autoRenewal = false;
  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Subscription has been cancelled. No further deliveries will be scheduled.",
    data: subscription,
  });
});

/**
 * @desc    Update delivery address and instructions for active subscription
 * @route   PATCH /api/customer/subscriptions/:id/address
 * @access  Private (Customer only)
 */
export const updateDeliveryAddress = asyncHandler(async (req, res) => {
  const { street, city, state, postalCode, landmark, contactPhone, notes } =
    req.body;

  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status === "CANCELLED" || subscription.status === "EXPIRED") {
    throw new ApiError(
      400,
      "Cannot update delivery details for expired or cancelled subscriptions",
    );
  }

  if (street) subscription.deliveryAddress.street = street.trim();
  if (city) subscription.deliveryAddress.city = city.trim();
  if (state !== undefined) subscription.deliveryAddress.state = state.trim();
  if (postalCode !== undefined)
    subscription.deliveryAddress.postalCode = postalCode.trim();
  if (landmark !== undefined)
    subscription.deliveryAddress.landmark = landmark.trim();
  if (contactPhone)
    subscription.deliveryAddress.contactPhone = contactPhone.trim();
  if (notes !== undefined) subscription.notes = notes.trim();

  await subscription.save();

  res.status(200).json({
    success: true,
    message: "Delivery details updated successfully for upcoming meals.",
    data: subscription,
  });
});

/**
 * @desc    Toggle auto-renewal for subscription
 * @route   PATCH /api/customer/subscriptions/:id/auto-renew
 * @access  Private (Customer only)
 */
export const toggleAutoRenewal = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (req.body.autoRenewal !== undefined) {
    subscription.autoRenewal = Boolean(req.body.autoRenewal);
  } else {
    subscription.autoRenewal = !subscription.autoRenewal;
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    message: `Auto-renewal has been ${subscription.autoRenewal ? "enabled" : "disabled"}.`,
    data: subscription,
  });
});

import Subscription from "../models/Subscription.js";
import TiffinPlan from "../models/TiffinPlan.js";
import TiffinProvider from "../models/TiffinProvider.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * Helper to parse a time string like "09:30 AM" or "04:30 PM" on a given base date
 */
const parseTimeStringToDate = (timeStr, baseDate = new Date()) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

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

  // Verify kitchen is accepting new orders & subscribers
  if (provider.isAcceptingOrders === false || provider.operatingStatus === "BUSY") {
    throw new ApiError(
      400,
      `${provider.businessName} is currently at prep capacity (Busy/Paused) and not accepting new orders or subscribers.`,
    );
  }

  // 3.1 Check for duplicate active or pending subscription for the same plan
  const existingPending = await Subscription.findOne({
    customerId: req.user._id,
    planId: plan._id,
    status: "PENDING",
  });
  if (existingPending) {
    throw new ApiError(
      400,
      "You already have a pending subscription request for this plan. Please wait for the kitchen to review and accept it.",
    );
  }

  const existingActive = await Subscription.findOne({
    customerId: req.user._id,
    planId: plan._id,
    status: "ACTIVE",
    endDate: { $gte: new Date() },
  });
  if (existingActive) {
    throw new ApiError(
      400,
      "You already have an active ongoing subscription for this plan.",
    );
  }

  // 4. Calculate subscription start date and evaluate Kitchen Cutoff Deadlines
  const now = new Date();
  let parsedStartDate = startDate ? new Date(startDate) : new Date();

  // If parsed date is invalid, default to today
  if (isNaN(parsedStartDate.getTime())) {
    parsedStartDate = new Date();
  }

  // Ensure start date cannot be in the past
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsedStartDate < startOfDay) {
    parsedStartDate = startOfDay;
  }

  // Check if requested start date is today
  const isToday =
    parsedStartDate.getFullYear() === now.getFullYear() &&
    parsedStartDate.getMonth() === now.getMonth() &&
    parsedStartDate.getDate() === now.getDate();

  let cutoffNotice = null;
  let cutoffApplied = false;

  if (isToday) {
    const orderTiming = provider.settings?.orderTiming || {};
    const lunchCutoffStr = orderTiming.lunchCutoff || "09:30 AM";
    const dinnerCutoffStr = orderTiming.dinnerCutoff || "04:30 PM";

    const lunchCutoffTime = parseTimeStringToDate(lunchCutoffStr, now);
    const dinnerCutoffTime = parseTimeStringToDate(dinnerCutoffStr, now);

    const mealType = (plan.mealType || "LUNCH").toUpperCase();

    if (mealType === "LUNCH" || mealType === "BREAKFAST") {
      if (lunchCutoffTime && now > lunchCutoffTime) {
        // Lunch cutoff passed -> roll over to tomorrow
        parsedStartDate.setDate(parsedStartDate.getDate() + 1);
        cutoffApplied = true;
        cutoffNotice = `Order placed after daily lunch cutoff (${lunchCutoffStr}). First delivery scheduled to start tomorrow.`;
      }
    } else if (mealType === "DINNER") {
      if (dinnerCutoffTime && now > dinnerCutoffTime) {
        // Dinner cutoff passed -> roll over to tomorrow
        parsedStartDate.setDate(parsedStartDate.getDate() + 1);
        cutoffApplied = true;
        cutoffNotice = `Order placed after daily dinner cutoff (${dinnerCutoffStr}). First delivery scheduled to start tomorrow.`;
      }
    } else if (mealType === "LUNCH_DINNER" || mealType === "ALL_MEALS") {
      if (dinnerCutoffTime && now > dinnerCutoffTime) {
        // Both cutoffs passed -> roll over to tomorrow
        parsedStartDate.setDate(parsedStartDate.getDate() + 1);
        cutoffApplied = true;
        cutoffNotice = `Order placed after daily dinner cutoff (${dinnerCutoffStr}). First delivery scheduled to start tomorrow.`;
      } else if (lunchCutoffTime && now > lunchCutoffTime) {
        // Lunch passed, but dinner is still open today
        cutoffApplied = true;
        cutoffNotice = `Order placed after lunch cutoff (${lunchCutoffStr}). Delivery begins today with dinner.`;
      }
    }

    // Align with deliveryDays if rolled over (e.g., skip weekend if WEEKDAYS_ONLY)
    if (cutoffApplied) {
      if (plan.deliveryDays === "WEEKDAYS_ONLY") {
        const day = parsedStartDate.getDay();
        if (day === 6) parsedStartDate.setDate(parsedStartDate.getDate() + 2); // Sat -> Mon
        if (day === 0) parsedStartDate.setDate(parsedStartDate.getDate() + 1); // Sun -> Mon
      } else if (plan.deliveryDays === "MON_TO_SAT") {
        const day = parsedStartDate.getDay();
        if (day === 0) parsedStartDate.setDate(parsedStartDate.getDate() + 1); // Sun -> Mon
      }
    }
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

  const combinedNotes = [
    (notes || "").trim(),
    cutoffNotice ? `[System]: ${cutoffNotice}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Determine initial order and subscription status based on kitchen's auto-accept setting
  const autoAccept = provider.settings?.orderTiming?.autoAcceptOrders !== false;
  const initialOrderStatus = autoAccept ? "ACCEPTED" : "PENDING";
  const initialSubscriptionStatus = autoAccept ? "ACTIVE" : "PENDING";

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
    notes: combinedNotes,
    status: initialSubscriptionStatus,
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
    status: initialOrderStatus,
    notes: combinedNotes || `Subscription #${subscription._id}`,
  });

  // 7.1 Auto-save delivery address to customer's address book if not already present
  try {
    const userDoc = await User.findById(req.user._id);
    if (userDoc) {
      if (!userDoc.addresses) userDoc.addresses = [];
      const alreadySaved = userDoc.addresses.some(
        (addr) =>
          addr.street?.trim().toLowerCase() === finalDeliveryAddress.street.toLowerCase() &&
          addr.city?.trim().toLowerCase() === finalDeliveryAddress.city.toLowerCase()
      );
      if (!alreadySaved) {
        const isFirst = userDoc.addresses.length === 0;
        userDoc.addresses.push({
          label: (deliveryAddress.label && deliveryAddress.label.trim()) || (isFirst ? "Home" : "Other"),
          street: finalDeliveryAddress.street,
          city: finalDeliveryAddress.city,
          postalCode: finalDeliveryAddress.postalCode || "",
          landmark: finalDeliveryAddress.landmark || "",
          contactPhone: finalDeliveryAddress.contactPhone || userDoc.phone || "",
          isDefault: isFirst,
        });
        await userDoc.save();
      }
    }
  } catch (saveAddrErr) {
    console.error("Auto-save address error:", saveAddrErr);
    // Non-fatal, do not break subscription creation
  }

  // 8. Populate provider info before responding
  const populatedSubscription = await Subscription.findById(subscription._id)
    .populate(
      "providerId",
      "businessName city address phone imageUrl foodType serviceArea rating settings",
    )
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  let responseMessage = "Subscribed successfully! Your meal deliveries will begin on schedule.";
  if (!autoAccept) {
    responseMessage = "Subscription request placed! Awaiting confirmation from kitchen.";
  } else if (cutoffApplied) {
    responseMessage = `${cutoffNotice} Subscribed successfully!`;
  }

  res.status(201).json({
    success: true,
    message: responseMessage,
    cutoffApplied,
    cutoffNotice,
    autoAccepted: autoAccept,
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

  // Enforce dynamic status updates & enrich remaining days & backfill deliveryHistory
  const enrichedSubscriptions = await Promise.all(
    subscriptions.map(async (sub) => {
      // Auto-backfill deliveryHistory if todayDispatchStatus is DELIVERED but not yet in deliveryHistory
      if (
        sub.todayDispatchStatus?.status === "DELIVERED" &&
        sub.todayDispatchStatus?.date
      ) {
        if (!sub.deliveryHistory) sub.deliveryHistory = [];
        const alreadyLogged = sub.deliveryHistory.some(
          (entry) =>
            entry.date === sub.todayDispatchStatus.date &&
            entry.status === "DELIVERED"
        );
        if (!alreadyLogged) {
          sub.deliveryHistory.push({
            date: sub.todayDispatchStatus.date,
            deliveredAt: sub.todayDispatchStatus.updatedAt || new Date(),
            mealType: sub.planSnapshot?.mealType || "LUNCH",
            status: "DELIVERED",
            deliveryAddress: sub.deliveryAddress,
            notes: sub.notes || "",
          });
          try {
            await sub.save();
          } catch (saveErr) {
            console.warn("Auto-sync deliveryHistory save error:", saveErr);
          }
        }
      }

      const subObj = sub.toObject();
      const end = new Date(sub.endDate);
      const diffMs = end - now;
      const isOngoing = sub.status === "ACTIVE" || sub.status === "PAUSED";
      const remainingDays = isOngoing
        ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        ...subObj,
        remainingDays,
        isExpiringSoon: sub.status === "ACTIVE" && remainingDays <= 3,
      };
    })
  );

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
  const isOngoing = subscription.status === "ACTIVE" || subscription.status === "PAUSED";
  const remainingDays = isOngoing
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
  const { reason } = req.body;

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

  const finalReason =
    (reason && typeof reason === "string" && reason.trim()) ||
    "Cancelled by customer";

  subscription.status = "CANCELLED";
  subscription.autoRenewal = false;
  subscription.cancellationReason = finalReason;
  subscription.cancelledBy = "CUSTOMER";
  subscription.cancelledAt = new Date();
  await subscription.save();

  // Synchronize linked Order record(s)
  await Order.updateMany(
    { subscriptionId: subscription._id },
    {
      $set: {
        status: "CANCELLED",
        cancellationReason: finalReason,
        cancelledBy: "CUSTOMER",
        cancelledAt: new Date(),
      },
    }
  );

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

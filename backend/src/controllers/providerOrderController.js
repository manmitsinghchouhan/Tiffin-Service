import Order from "../models/Order.js";
import Subscription from "../models/Subscription.js";
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
 * @desc    Get aggregate commercial order KPI stats
 * @route   GET /api/provider/orders/stats
 * @access  Private (Provider only)
 */
export const getProviderOrderStats = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Self-heal: ensure orders linked to cancelled subscriptions reflect CANCELLED status
  const cancelledSubs = await Subscription.find({
    providerId: provider._id,
    status: "CANCELLED",
  }).select("_id cancellationReason cancelledBy updatedAt");

  if (cancelledSubs.length > 0) {
    for (const sub of cancelledSubs) {
      await Order.updateMany(
        {
          providerId: provider._id,
          subscriptionId: sub._id,
          status: { $ne: "CANCELLED" },
        },
        {
          $set: {
            status: "CANCELLED",
            cancellationReason:
              sub.cancellationReason || "Kitchen reached maximum cooking capacity",
            cancelledBy: sub.cancelledBy || "PROVIDER",
            cancelledAt: sub.updatedAt || new Date(),
          },
        }
      );
    }
  }

  const [
    totalOrders,
    acceptedOrders,
    completedOrders,
    revenueAgg,
    todayActiveSubs,
    todayPausedSubs,
    pendingOrdersCount,
  ] = await Promise.all([
    // Total lifetime orders
    Order.countDocuments({ providerId: provider._id }),

    // Active accepted orders
    Order.countDocuments({ providerId: provider._id, status: "ACCEPTED" }),

    // Successfully completed orders
    Order.countDocuments({ providerId: provider._id, status: "COMPLETED" }),

    // Total revenue from Accepted & Completed orders
    Order.aggregate([
      {
        $match: {
          providerId: provider._id,
          status: { $in: ["ACCEPTED", "COMPLETED"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]),

    // Active subscriptions scheduled for delivery today
    Subscription.countDocuments({
      providerId: provider._id,
      status: "ACTIVE",
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
    }),

    // Paused subscriptions scheduled for delivery today
    Subscription.countDocuments({
      providerId: provider._id,
      status: "PAUSED",
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
    }),

    // Pending commercial orders waiting for kitchen approval
    Order.countDocuments({ providerId: provider._id, status: "PENDING" }),
  ]);

  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      acceptedOrders,
      completedOrders,
      totalRevenue,
      todayDeliveriesCount: todayActiveSubs,
      todayPausedCount: todayPausedSubs,
      pendingOrdersCount,
    },
  });
});

/**
 * @desc    Get Daily Kitchen Run-Sheet (tally count & dispatch list for today or selected date)
 * @route   GET /api/provider/orders/daily-dispatch
 * @access  Private (Provider only)
 */
export const getProviderDailyDispatch = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { date, mealType = "ALL" } = req.query;

  // Determine target date
  const targetDate = date ? new Date(date) : new Date();
  const validTargetDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;

  const startOfDay = new Date(
    validTargetDate.getFullYear(),
    validTargetDate.getMonth(),
    validTargetDate.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    validTargetDate.getFullYear(),
    validTargetDate.getMonth(),
    validTargetDate.getDate(),
    23,
    59,
    59,
    999
  );

  const dayOfWeekIndex = validTargetDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
  const isSunday = dayOfWeekIndex === 0;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = dayNames[dayOfWeekIndex];

  // Fetch all subscriptions active or paused during this date window
  const subscriptions = await Subscription.find({
    providerId: provider._id,
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
    status: { $in: ["ACTIVE", "PAUSED"] },
  })
    .populate("customerId", "name email phone")
    .populate("planId", "name durationDays mealType diet price")
    .sort({ createdAt: -1 });

  let deliverableCount = 0;
  let vegCount = 0;
  let nonVegCount = 0;
  let pausedCount = 0;
  let skippedScheduleCount = 0;

  const dispatchList = [];

  for (const sub of subscriptions) {
    const plan = sub.planSnapshot || {};
    const deliveryDays = plan.deliveryDays || "ALL_DAYS";
    const subMealType = plan.mealType || "LUNCH";

    // 1. Check schedule compatibility with today's day of week
    if (deliveryDays === "WEEKDAYS_ONLY" && isWeekend) {
      skippedScheduleCount++;
      continue;
    }
    if (deliveryDays === "MON_TO_SAT" && isSunday) {
      skippedScheduleCount++;
      continue;
    }

    // 2. Check meal slot compatibility (BREAKFAST, LUNCH, DINNER)
    const normalizedMealFilter = mealType.trim().toUpperCase();
    if (normalizedMealFilter !== "ALL") {
      let matchesMeal = false;
      if (subMealType === "ALL_MEALS") {
        matchesMeal = true;
      } else if (subMealType === "LUNCH_DINNER") {
        matchesMeal = normalizedMealFilter === "LUNCH" || normalizedMealFilter === "DINNER";
      } else if (subMealType === normalizedMealFilter) {
        matchesMeal = true;
      }

      if (!matchesMeal) {
        continue;
      }
    }

    // 3. Check subscription pause status
    if (sub.status === "PAUSED") {
      pausedCount++;
      dispatchList.push({
        _id: sub._id,
        subscriptionId: sub._id,
        orderCode: `#ORD-${sub._id.toString().slice(-6).toUpperCase()}`,
        customer: {
          _id: sub.customerId?._id,
          name: sub.customerId?.name || "Customer",
          phone: sub.customerId?.phone || sub.deliveryAddress?.contactPhone || "",
          email: sub.customerId?.email || "",
        },
        deliveryAddress: sub.deliveryAddress,
        planTitle: plan.name || "Subscription Plan",
        mealType: subMealType,
        diet: plan.diet || "VEG",
        notes: sub.notes || "",
        status: "PAUSED",
        deliveryStatus: "PAUSED",
        isPaused: true,
      });
      continue;
    }

    // 4. Deliverable meal
    deliverableCount++;
    if (plan.diet === "NON_VEG") {
      nonVegCount++;
    } else {
      vegCount++;
    }

    const targetDateStr = validTargetDate.toISOString().split("T")[0];
    const isMatchingDate = sub.todayDispatchStatus?.date === targetDateStr;
    const currentDispatchStatus = isMatchingDate && sub.todayDispatchStatus?.status
      ? sub.todayDispatchStatus.status
      : "PREPARING";

    dispatchList.push({
      _id: sub._id,
      subscriptionId: sub._id,
      orderCode: `#ORD-${sub._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        _id: sub.customerId?._id,
        name: sub.customerId?.name || "Customer",
        phone: sub.customerId?.phone || sub.deliveryAddress?.contactPhone || "",
        email: sub.customerId?.email || "",
      },
      deliveryAddress: sub.deliveryAddress,
      planTitle: plan.name || "Subscription Plan",
      mealType: subMealType,
      diet: plan.diet || "VEG",
      notes: sub.notes || "",
      status: "ACTIVE",
      deliveryStatus: currentDispatchStatus,
      todayDispatchStatus: sub.todayDispatchStatus || null,
      isPaused: false,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      date: validTargetDate.toISOString(),
      dayName,
      mealSlot: mealType,
      summary: {
        totalMeals: deliverableCount,
        vegCount,
        nonVegCount,
        pausedCount,
        skippedScheduleCount,
      },
      dispatchList,
    },
  });
});

/**
 * @desc    Fetch commercial purchase orders with search, status filters & pagination
 * @route   GET /api/provider/orders
 * @access  Private (Provider only)
 */
export const getProviderOrders = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { status, search, page = 1, limit = 20 } = req.query;

  const query = { providerId: provider._id };

  // Status Filter
  if (status && status.trim().toUpperCase() !== "ALL") {
    const normStatus = status.trim().toUpperCase();
    if (["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"].includes(normStatus)) {
      query.status = normStatus;
    }
  }

  // Search Filter (customer name, email, phone, street, landmark, or order ID)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

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

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate("customerId", "name email phone")
    .populate("planId", "name durationDays mealType diet price features")
    .populate("subscriptionId", "status startDate endDate autoRenewal");

  const enrichedOrders = orders.map((order) => {
    const o = order.toObject();
    const orderCode = `#ORD-${order._id.toString().slice(-6).toUpperCase()}`;
    return {
      ...o,
      orderCode,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedOrders.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: enrichedOrders,
  });
});

/**
 * @desc    Get single order details for commercial invoice & receipt inspection
 * @route   GET /api/provider/orders/:id
 * @access  Private (Provider only)
 */
export const getProviderOrderById = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const order = await Order.findOne({
    _id: req.params.id,
    providerId: provider._id,
  })
    .populate("customerId", "name email phone")
    .populate("planId", "name durationDays mealType diet features price imageUrl")
    .populate("subscriptionId", "status startDate endDate autoRenewal");

  if (!order) {
    throw new ApiError(404, "Order record not found for this kitchen");
  }

  const orderCode = `#ORD-${order._id.toString().slice(-6).toUpperCase()}`;

  res.status(200).json({
    success: true,
    data: {
      ...order.toObject(),
      orderCode,
    },
  });
});

/**
 * @desc    Update order status (ACCEPT, REJECT, COMPLETE, CANCEL)
 * @route   PATCH /api/provider/orders/:id/status
 * @access  Private (Provider only)
 */
export const updateProviderOrderStatus = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { status } = req.body;

  if (!status || !["ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"].includes(status.toUpperCase())) {
    throw new ApiError(400, "Please provide a valid status: ACCEPTED, REJECTED, COMPLETED, or CANCELLED");
  }

  const order = await Order.findOne({
    _id: req.params.id,
    providerId: provider._id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found for this kitchen");
  }

  const newStatus = status.toUpperCase();
  order.status = newStatus;

  const rejectionReason = (req.body.cancellationReason || req.body.reason || "").trim();
  if (rejectionReason) {
    order.cancellationReason = rejectionReason;
  }
  await order.save();

  // If accepted, also activate linked subscription
  if (newStatus === "ACCEPTED" && order.subscriptionId) {
    await Subscription.findByIdAndUpdate(order.subscriptionId, {
      status: "ACTIVE",
    });
  }

  // If rejected or cancelled, also update linked subscription
  if (["REJECTED", "CANCELLED"].includes(newStatus) && order.subscriptionId) {
    const finalReason = rejectionReason || "Rejected by kitchen provider";
    await Subscription.findByIdAndUpdate(order.subscriptionId, {
      status: "CANCELLED",
      autoRenewal: false,
      cancellationReason: finalReason,
      cancelledBy: "PROVIDER",
      cancelledAt: new Date(),
    });
  }

  res.status(200).json({
    success: true,
    message: `Order status has been updated to ${newStatus}.`,
    data: order,
  });
});

/**
 * @desc    Update daily dispatch progress stage for a subscriber meal
 * @route   PATCH /api/provider/orders/dispatch-status/:subscriptionId
 * @access  Private (Provider only)
 */
export const updateSubscriptionDispatchStatus = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { subscriptionId } = req.params;
  const { status, date } = req.body;

  const validStatuses = ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid dispatch status. Allowed: PREPARING, OUT_FOR_DELIVERY, DELIVERED");
  }

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    providerId: provider._id,
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found or not owned by your kitchen");
  }

  const dispatchDate = date || new Date().toISOString().split("T")[0];

  subscription.todayDispatchStatus = {
    status,
    date: dispatchDate,
    updatedAt: new Date(),
  };

  // If status is DELIVERED, record a permanent instance in deliveryHistory
  if (status === "DELIVERED") {
    if (!subscription.deliveryHistory) {
      subscription.deliveryHistory = [];
    }
    const alreadyLogged = subscription.deliveryHistory.some(
      (entry) => entry.date === dispatchDate && entry.status === "DELIVERED"
    );

    if (!alreadyLogged) {
      subscription.deliveryHistory.push({
        date: dispatchDate,
        deliveredAt: new Date(),
        mealType: subscription.planSnapshot?.mealType || "LUNCH",
        status: "DELIVERED",
        deliveryAddress: subscription.deliveryAddress,
        notes: subscription.notes || "",
      });
    }
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    message: `Meal dispatch status updated to ${status}`,
    data: {
      subscriptionId: subscription._id,
      todayDispatchStatus: subscription.todayDispatchStatus,
      deliveryHistory: subscription.deliveryHistory,
    },
  });
});

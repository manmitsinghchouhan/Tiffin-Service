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
 * @desc    Get aggregate customer directory KPI metrics for the provider dashboard
 * @route   GET /api/provider/customers/stats
 * @access  Private (Provider only)
 */
export const getProviderCustomerStats = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  // Group all subscriptions by customer to compute customer-level metrics
  const customerStatsAgg = await Subscription.aggregate([
    {
      $match: {
        providerId: provider._id,
      },
    },
    {
      $group: {
        _id: "$customerId",
        totalSpend: { $sum: "$totalAmount" },
        subCount: { $sum: 1 },
        statuses: { $push: "$status" },
      },
    },
  ]);

  const totalCustomers = customerStatsAgg.length;

  let activeCustomers = 0;
  let repeatCustomers = 0;
  let lapsedCustomers = 0;
  let totalRevenue = 0;

  for (const c of customerStatsAgg) {
    totalRevenue += c.totalSpend || 0;

    const hasActive = c.statuses.includes("ACTIVE");
    const hasPaused = c.statuses.includes("PAUSED");

    if (hasActive) {
      activeCustomers++;
    } else if (!hasPaused) {
      // Only expired or cancelled subscriptions
      lapsedCustomers++;
    }

    if (c.subCount >= 2) {
      repeatCustomers++;
    }
  }

  const avgLtv = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalCustomers,
      activeCustomers,
      repeatCustomers,
      lapsedCustomers,
      avgLtv,
      repeatRate,
    },
  });
});

/**
 * @desc    Fetch paginated customer directory with search, segmentation filters & metrics
 * @route   GET /api/provider/customers
 * @access  Private (Provider only)
 */
export const getProviderCustomers = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { search, status, segment, sortBy, page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // 1. Aggregate unique customers from their subscriptions with this kitchen
  const pipeline = [
    {
      $match: {
        providerId: provider._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: "$customerId",
        totalSpent: { $sum: "$totalAmount" },
        totalSubscriptions: { $sum: 1 },
        statuses: { $push: "$status" },
        subscriptions: { $push: "$$ROOT" },
        latestSubscription: { $first: "$$ROOT" },
        firstSubscriptionDate: { $last: "$createdAt" },
        lastSubscriptionDate: { $first: "$createdAt" },
      },
    },
    // Populate customer user details
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    {
      $unwind: "$customerInfo",
    },
  ];

  // 2. Search Filter (customer name, email, phone, street, city)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    pipeline.push({
      $match: {
        $or: [
          { "customerInfo.name": searchRegex },
          { "customerInfo.email": searchRegex },
          { "customerInfo.phone": searchRegex },
          { "latestSubscription.deliveryAddress.street": searchRegex },
          { "latestSubscription.deliveryAddress.city": searchRegex },
          { "latestSubscription.deliveryAddress.landmark": searchRegex },
          { "latestSubscription.planSnapshot.name": searchRegex },
        ],
      },
    });
  }

  // 3. Status Filter (ACTIVE, PAUSED, LAPSED)
  if (status && status.trim().toUpperCase() !== "ALL") {
    const normStatus = status.trim().toUpperCase();
    if (normStatus === "ACTIVE") {
      pipeline.push({ $match: { statuses: "ACTIVE" } });
    } else if (normStatus === "PAUSED") {
      pipeline.push({
        $match: {
          statuses: "PAUSED",
          $nor: [{ statuses: "ACTIVE" }],
        },
      });
    } else if (normStatus === "LAPSED") {
      pipeline.push({
        $match: {
          $nor: [{ statuses: "ACTIVE" }, { statuses: "PAUSED" }],
        },
      });
    }
  }

  // 4. Segment Filter (REPEAT, NEW)
  if (segment && segment.trim().toUpperCase() !== "ALL") {
    const normSegment = segment.trim().toUpperCase();
    if (normSegment === "REPEAT") {
      pipeline.push({ $match: { totalSubscriptions: { $gte: 2 } } });
    } else if (normSegment === "NEW") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      pipeline.push({
        $match: {
          firstSubscriptionDate: { $gte: thirtyDaysAgo },
        },
      });
    }
  }

  // 5. Sorting
  const sortStage = {};
  if (sortBy === "spend_desc") {
    sortStage.totalSpent = -1;
  } else if (sortBy === "subs_desc") {
    sortStage.totalSubscriptions = -1;
  } else if (sortBy === "name_asc") {
    sortStage["customerInfo.name"] = 1;
  } else {
    // Default: most recently subscribed customer first
    sortStage.lastSubscriptionDate = -1;
  }
  pipeline.push({ $sort: sortStage });

  // 6. Facet for total count & paginated records
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limitNum }],
    },
  });

  const [result] = await Subscription.aggregate(pipeline);

  const total = result.metadata[0]?.total || 0;
  const rawCustomers = result.data || [];

  // 7. Format clean client-ready customer models
  const customers = rawCustomers.map((c) => {
    const activeSubs = (c.subscriptions || []).filter((s) => s.status === "ACTIVE");
    const activePlans = activeSubs.map((s) => s.planSnapshot || s);
    const hasActive = activeSubs.length > 0;
    const hasPaused = c.statuses.includes("PAUSED");

    const derivedStatus = hasActive
      ? "ACTIVE"
      : hasPaused
      ? "PAUSED"
      : "LAPSED";

    return {
      _id: c._id,
      name: c.customerInfo.name,
      email: c.customerInfo.email,
      phone: c.customerInfo.phone,
      totalSpent: c.totalSpent,
      totalSubscriptions: c.totalSubscriptions,
      status: derivedStatus,
      isRepeat: c.totalSubscriptions >= 2,
      activePlans,
      activePlan: activePlans[0] || null,
      primaryAddress: c.latestSubscription?.deliveryAddress,
      notes: c.latestSubscription?.notes || "",
      customerSince: c.firstSubscriptionDate,
      lastOrderDate: c.lastSubscriptionDate,
    };
  });

  res.status(200).json({
    success: true,
    count: customers.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: customers,
  });
});

/**
 * @desc    Fetch complete 360-degree customer profile & subscription history for this kitchen
 * @route   GET /api/provider/customers/:id
 * @access  Private (Provider only)
 */
export const getProviderCustomerById = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const customerId = req.params.id;

  const customer = await User.findById(customerId).select(
    "name email phone status createdAt"
  );

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  // Fetch all subscriptions this customer has with this specific kitchen
  const subscriptions = await Subscription.find({
    providerId: provider._id,
    customerId,
  })
    .sort({ createdAt: -1 })
    .populate("planId", "name durationDays mealType diet features price imageUrl");

  if (subscriptions.length === 0) {
    throw new ApiError(
      404,
      "No customer relationship or orders found with your kitchen"
    );
  }

  const now = new Date();

  let totalSpent = 0;
  const activeSubscriptions = [];
  const addresses = [];
  const notesList = [];

  const subscriptionHistory = subscriptions.map((sub) => {
    totalSpent += sub.totalAmount || 0;

    const subObj = sub.toObject();
    const end = new Date(sub.endDate);
    const diffMs = end - now;
    const remainingDays =
      sub.status === "ACTIVE"
        ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        : sub.status === "PAUSED" && sub.pausedAt
        ? Math.max(0, Math.ceil((end - new Date(sub.pausedAt)) / (1000 * 60 * 60 * 24)))
        : 0;

    const enrichedSub = {
      ...subObj,
      remainingDays,
    };

    if (sub.status === "ACTIVE") {
      activeSubscriptions.push(enrichedSub);
    }

    if (sub.deliveryAddress?.street) {
      const addrKey = `${sub.deliveryAddress.street}-${sub.deliveryAddress.city}`;
      if (!addresses.some((a) => `${a.street}-${a.city}` === addrKey)) {
        addresses.push(sub.deliveryAddress);
      }
    }

    if (sub.notes && sub.notes.trim()) {
      notesList.push({
        note: sub.notes.trim(),
        date: sub.createdAt,
        planName: sub.planSnapshot?.name || "Plan",
      });
    }

    return enrichedSub;
  });

  const latestDeliveryAddress =
    subscriptions[0]?.deliveryAddress || null;

  res.status(200).json({
    success: true,
    data: {
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        memberSince: customer.createdAt,
      },
      metrics: {
        totalSpent,
        totalSubscriptions: subscriptions.length,
        isRepeat: subscriptions.length >= 2,
        firstOrderDate: subscriptions[subscriptions.length - 1]?.createdAt,
        lastOrderDate: subscriptions[0]?.createdAt,
        hasActivePlan: activeSubscriptions.length > 0,
        activePlansCount: activeSubscriptions.length,
      },
      activeSubscriptions,
      activeSubscription: activeSubscriptions[0] || null,
      allSubscriptions: subscriptionHistory,
      subscriptionHistory,
      primaryAddress: latestDeliveryAddress,
      allAddresses: addresses,
      dietaryNotes: notesList,
    },
  });
});

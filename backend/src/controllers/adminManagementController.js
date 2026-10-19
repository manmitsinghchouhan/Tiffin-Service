import {
  User,
  TiffinProvider,
  TiffinPlan,
  Order,
  Subscription,
} from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Get aggregated dashboard summary stats and recent platform activity
 * @route   GET /api/admin/stats (or /api/admin/dashboard/stats)
 * @access  Private (Admin only)
 */
export const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // Execute metric counts and revenue aggregations in parallel for maximum speed
  const [
    totalCustomers,
    totalProviders,
    pendingProviders,
    verifiedProviders,
    rejectedProviders,
    totalPlans,
    totalOrders,
    totalSubscriptions,
    recentApplications,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({ role: "CUSTOMER" }),
    User.countDocuments({ role: "PROVIDER" }),
    TiffinProvider.countDocuments({ verificationStatus: "PENDING" }),
    TiffinProvider.countDocuments({ verificationStatus: "VERIFIED" }),
    TiffinProvider.countDocuments({ verificationStatus: "REJECTED" }),
    TiffinPlan.countDocuments(),
    Order.countDocuments(),
    Subscription.countDocuments(),
    // Recent 5 provider applications with owner info
    TiffinProvider.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email phone createdAt"),
    // Recent 5 registered users
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone role status createdAt"),
  ]);

  // Aggregate total platform order revenue
  const revenueAggregation = await Order.aggregate([
    { $match: { status: { $ne: "CANCELLED" } } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        customers: {
          total: totalCustomers,
        },
        providers: {
          totalUsers: totalProviders,
          pending: pendingProviders,
          verified: verifiedProviders,
          rejected: rejectedProviders,
          totalProfiles: pendingProviders + verifiedProviders + rejectedProviders,
        },
        business: {
          totalPlans,
          totalOrders,
          totalSubscriptions,
          totalRevenue,
        },
      },
      recentActivity: {
        applications: recentApplications,
        users: recentUsers,
      },
    },
  });
});

/**
 * @desc    Get paginated and filtered list of tiffin providers for approval & oversight
 * @route   GET /api/admin/providers
 * @access  Private (Admin only)
 */
export const getAllProviders = asyncHandler(async (req, res) => {
  const { status, city, search, page = 1, limit = 10 } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10));
  const pageSize = Math.max(1, parseInt(limit, 10));
  const skip = (pageNumber - 1) * pageSize;

  const filter = {};

  // Filter by verification status if specified
  if (status && status !== "ALL") {
    filter.verificationStatus = status.toUpperCase();
  }

  // Filter by city if specified
  if (city) {
    filter.city = new RegExp(city.trim(), "i");
  }

  // Keyword search by businessName or address
  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { businessName: searchRegex },
      { address: searchRegex },
      { city: searchRegex },
    ];
  }

  // Query providers and total count in parallel
  const [providers, totalCount] = await Promise.all([
    TiffinProvider.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "name email phone role status createdAt"),
    TiffinProvider.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({
    success: true,
    data: {
      providers,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProviders: totalCount,
        hasMore: pageNumber < totalPages,
      },
    },
  });
});

/**
 * @desc    Get full details of a specific tiffin provider
 * @route   GET /api/admin/providers/:id
 * @access  Private (Admin only)
 */
export const getProviderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await TiffinProvider.findById(id).populate(
    "userId",
    "name email phone role status createdAt",
  );

  if (!provider) {
    throw new ApiError(404, "Tiffin provider not found");
  }

  // Fetch plans created by this provider (if any)
  const plans = await TiffinPlan.find({ providerId: provider._id });

  res.status(200).json({
    success: true,
    data: {
      provider,
      plans,
    },
  });
});

/**
 * @desc    Approve / Verify a tiffin provider
 * @route   PATCH /api/admin/providers/:id/verify
 * @access  Private (Admin only)
 */
export const verifyProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const provider = await TiffinProvider.findById(id).populate(
    "userId",
    "name email phone",
  );

  if (!provider) {
    throw new ApiError(404, "Tiffin provider application not found");
  }

  // Update status to VERIFIED and clear any previous rejection reason
  provider.verificationStatus = "VERIFIED";
  provider.rejectionReason = undefined;
  await provider.save();

  res.status(200).json({
    success: true,
    message: `Provider "${provider.businessName}" has been successfully verified!`,
    data: {
      provider,
    },
  });
});

/**
 * @desc    Reject a tiffin provider application with a reason
 * @route   PATCH /api/admin/providers/:id/reject
 * @access  Private (Admin only)
 */
export const rejectProvider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason || !rejectionReason.trim()) {
    throw new ApiError(
      400,
      "Please provide a reason for rejecting the provider application",
    );
  }

  const provider = await TiffinProvider.findById(id).populate(
    "userId",
    "name email phone",
  );

  if (!provider) {
    throw new ApiError(404, "Tiffin provider application not found");
  }

  provider.verificationStatus = "REJECTED";
  provider.rejectionReason = rejectionReason.trim();
  await provider.save();

  res.status(200).json({
    success: true,
    message: `Provider "${provider.businessName}" application has been rejected.`,
    data: {
      provider,
    },
  });
});

/**
 * @desc    Get paginated and filtered list of users (Customers, Providers, Admins)
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10));
  const pageSize = Math.max(1, parseInt(limit, 10));
  const skip = (pageNumber - 1) * pageSize;

  const filter = {};

  // Filter by role if specified (e.g. CUSTOMER, PROVIDER, ADMIN)
  if (role && role !== "ALL") {
    filter.role = role.toUpperCase();
  }

  // Filter by account status if specified
  if (status && status !== "ALL") {
    filter.status = status.toUpperCase();
  }

  // Keyword search by name, email, or phone
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const sortDirection = order === "asc" ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  // Fetch users and total count in parallel
  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: totalCount,
        hasMore: pageNumber < totalPages,
      },
    },
  });
});

/**
 * @desc    Get detailed user information including orders/subscriptions or provider profile
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let customerData = null;
  let providerData = null;

  if (user.role === "CUSTOMER") {
    // Fetch recent orders, subscriptions, and summary metrics for the customer
    const [orders, subscriptions, orderStats] = await Promise.all([
      Order.find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("providerId", "businessName city contactNumber"),
      Subscription.find({ customerId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("providerId", "businessName city contactNumber"),
      Order.aggregate([
        { $match: { customerId: user._id, status: { $ne: "CANCELLED" } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    customerData = {
      recentOrders: orders,
      subscriptions,
      metrics: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
      },
    };
  } else if (user.role === "PROVIDER") {
    // Fetch provider kitchen profile and plans
    const [profile, plans] = await Promise.all([
      TiffinProvider.findOne({ userId: user._id }),
      TiffinPlan.find({ providerId: user._id }),
    ]);
    providerData = {
      profile,
      plans,
    };
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      customerData,
      providerData,
    },
  });
});

/**
 * @desc    Update a user's account status (ACTIVE, INACTIVE, SUSPENDED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    throw new ApiError(
      400,
      `Invalid status. Status must be one of: [${validStatuses.join(", ")}]`,
    );
  }

  // Safety check: Prevent admin from changing their own active account status
  if (req.user._id.toString() === id) {
    throw new ApiError(400, "You cannot alter the status of your own administrator account.");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.status = status.toUpperCase();
  await user.save();

  res.status(200).json({
    success: true,
    message: `Account status for "${user.name}" updated to ${user.status}.`,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    },
  });
});

/**
 * @desc    Delete a user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user._id.toString() === id) {
    throw new ApiError(400, "You cannot delete your own administrator account.");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If user is a provider, delete associated provider profile as well
  if (user.role === "PROVIDER") {
    await TiffinProvider.findOneAndDelete({ userId: user._id });
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: `User account "${user.name}" (${user.email}) has been permanently deleted.`,
  });
});

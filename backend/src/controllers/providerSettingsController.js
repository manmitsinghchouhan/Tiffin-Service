import User from "../models/User.js";
import TiffinProvider from "../models/TiffinProvider.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const DEFAULT_SETTINGS = {
  orderTiming: {
    lunchCutoff: "09:30 AM",
    dinnerCutoff: "04:30 PM",
    lunchDeliveryWindow: "12:00 PM - 01:30 PM",
    dinnerDeliveryWindow: "07:30 PM - 09:00 PM",
    autoAcceptOrders: true,
  },
  notifications: {
    whatsappAlerts: true,
    emailDigest: true,
    customerPauseAlerts: true,
    lowPrepWarnings: true,
  },
  subscriptionPolicy: {
    pauseNoticeHours: 24,
    defaultAutoRenew: true,
  },
  holidayMode: {
    enabled: false,
    startDate: null,
    endDate: null,
    reason: "",
  },
};

/**
 * @desc    Fetch provider settings (account info, operational timing, alerts, policy)
 * @route   GET /api/provider/settings
 * @access  Private (Provider only)
 */
export const getProviderSettings = asyncHandler(async (req, res) => {
  const provider = await TiffinProvider.findOne({ userId: req.user._id }).lean();

  if (!provider) {
    throw new ApiError(404, "Provider business profile not found");
  }

  // Merge with default settings to ensure complete schema
  const settings = {
    orderTiming: {
      ...DEFAULT_SETTINGS.orderTiming,
      ...(provider.settings?.orderTiming || {}),
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(provider.settings?.notifications || {}),
    },
    subscriptionPolicy: {
      ...DEFAULT_SETTINGS.subscriptionPolicy,
      ...(provider.settings?.subscriptionPolicy || {}),
    },
    holidayMode: {
      ...DEFAULT_SETTINGS.holidayMode,
      ...(provider.settings?.holidayMode || {}),
    },
  };

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        status: req.user.status,
      },
      kitchen: {
        id: provider._id,
        businessName: provider.businessName,
        city: provider.city,
        isAcceptingOrders: provider.isAcceptingOrders,
        operatingStatus: provider.operatingStatus,
      },
      settings,
    },
  });
});

/**
 * @desc    Update provider operational timing, alert preferences, and subscription policies
 * @route   PUT /api/provider/settings
 * @access  Private (Provider only)
 */
export const updateProviderSettings = asyncHandler(async (req, res) => {
  const provider = await TiffinProvider.findOne({ userId: req.user._id });

  if (!provider) {
    throw new ApiError(404, "Provider business profile not found");
  }

  const { orderTiming, notifications, subscriptionPolicy, holidayMode } = req.body;

  if (!provider.settings) {
    provider.settings = { ...DEFAULT_SETTINGS };
  }

  // 1. Order Timing & Windows
  if (orderTiming) {
    provider.settings.orderTiming = {
      lunchCutoff: orderTiming.lunchCutoff || provider.settings.orderTiming?.lunchCutoff || "09:30 AM",
      dinnerCutoff: orderTiming.dinnerCutoff || provider.settings.orderTiming?.dinnerCutoff || "04:30 PM",
      lunchDeliveryWindow: orderTiming.lunchDeliveryWindow || provider.settings.orderTiming?.lunchDeliveryWindow || "12:00 PM - 01:30 PM",
      dinnerDeliveryWindow: orderTiming.dinnerDeliveryWindow || provider.settings.orderTiming?.dinnerDeliveryWindow || "07:30 PM - 09:00 PM",
      autoAcceptOrders:
        orderTiming.autoAcceptOrders !== undefined
          ? Boolean(orderTiming.autoAcceptOrders)
          : provider.settings.orderTiming?.autoAcceptOrders ?? true,
    };
  }

  // 2. Alert & Notification Preferences
  if (notifications) {
    provider.settings.notifications = {
      whatsappAlerts:
        notifications.whatsappAlerts !== undefined
          ? Boolean(notifications.whatsappAlerts)
          : provider.settings.notifications?.whatsappAlerts ?? true,
      emailDigest:
        notifications.emailDigest !== undefined
          ? Boolean(notifications.emailDigest)
          : provider.settings.notifications?.emailDigest ?? true,
      customerPauseAlerts:
        notifications.customerPauseAlerts !== undefined
          ? Boolean(notifications.customerPauseAlerts)
          : provider.settings.notifications?.customerPauseAlerts ?? true,
      lowPrepWarnings:
        notifications.lowPrepWarnings !== undefined
          ? Boolean(notifications.lowPrepWarnings)
          : provider.settings.notifications?.lowPrepWarnings ?? true,
    };
  }

  // 3. Subscription Policies & Rules
  if (subscriptionPolicy) {
    const noticeHours = parseInt(subscriptionPolicy.pauseNoticeHours, 10);
    provider.settings.subscriptionPolicy = {
      pauseNoticeHours: !isNaN(noticeHours) && noticeHours >= 0 ? noticeHours : 24,
      defaultAutoRenew:
        subscriptionPolicy.defaultAutoRenew !== undefined
          ? Boolean(subscriptionPolicy.defaultAutoRenew)
          : provider.settings.subscriptionPolicy?.defaultAutoRenew ?? true,
    };
  }

  // 4. Temporary Kitchen Holiday Closure
  if (holidayMode) {
    const isHoliday = Boolean(holidayMode.enabled);
    provider.settings.holidayMode = {
      enabled: isHoliday,
      startDate: holidayMode.startDate ? new Date(holidayMode.startDate) : null,
      endDate: holidayMode.endDate ? new Date(holidayMode.endDate) : null,
      reason: (holidayMode.reason || "").trim(),
    };

    // If holiday mode is enabled, also pause order intake
    if (isHoliday) {
      provider.isAcceptingOrders = false;
      provider.operatingStatus = "BUSY";
    }
  }

  await provider.save();

  res.status(200).json({
    success: true,
    message: "Settings preferences updated successfully",
    data: provider.settings,
  });
});

/**
 * @desc    Change provider account password
 * @route   PUT /api/provider/settings/password
 * @access  Private (Provider only)
 */
export const updateProviderPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(
      400,
      "Please provide current password, new password, and confirm password",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  // Fetch user with password hash
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Update password (pre-save hook will automatically hash it)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Your account is secure.",
  });
});

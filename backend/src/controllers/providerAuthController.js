import User from "../models/User.js";
import TiffinProvider from "../models/TiffinProvider.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateToken } from "../utils/jwt.js";

// Secure HTTP-Only Cookie Configuration
export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Helper to determine provider onboarding stage
const computeProviderStage = (providerProfile) => {
  if (!providerProfile) return "NEEDS_PROFILE";
  switch (providerProfile.verificationStatus) {
    case "PENDING":
      return "PENDING_APPROVAL";
    case "VERIFIED":
      // Approach 2: If verified but hasn't acknowledged the approval milestone yet,
      // return APPROVED_MILESTONE so the celebration screen is shown.
      // Once acknowledged, stage is permanently VERIFIED (direct dashboard).
      return providerProfile.hasAcknowledgedApproval
        ? "VERIFIED"
        : "APPROVED_MILESTONE";
    case "REJECTED":
      return "REJECTED";
    default:
      return "NEEDS_PROFILE";
  }
};

/**
 * @desc    Step 1 of 2 — Partner Account Creation (Auto-authenticated)
 * @route   POST /api/provider/register (or /api/provider/auth/register)
 * @access  Public
 */
export const providerRegister = asyncHandler(async (req, res) => {
  const { fullName, name, email, phone, password, confirmPassword } = req.body;
  const ownerName = (fullName || name || "").trim();

  // Validate required fields
  if (!ownerName || !email || !phone || !password || !confirmPassword) {
    throw new ApiError(
      400,
      "Please provide all required fields: full name, email, phone, password, and confirm password",
    );
  }

  // Password matching
  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match");
  }

  // Password length
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check for existing account
  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email or phone number already exists",
    );
  }

  // Create provider user (role strictly PROVIDER)
  const provider = await User.create({
    name: ownerName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: "PROVIDER",
    status: "ACTIVE",
  });

  const token = generateToken({ id: provider._id, role: provider.role });

  // Establish immediate session via HTTP-only secure cookie
  res.cookie("providerToken", token, getCookieOptions());

  res.status(201).json({
    success: true,
    message: "Partner account created and session established",
    data: {
      user: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        role: provider.role,
        status: provider.status,
      },
      onboardingStatus: "NEEDS_PROFILE",
    },
  });
});

/**
 * @desc    "Already a Partner" Login
 * @route   POST /api/provider/login (or /api/provider/auth/login)
 * @access  Public (Restricted to PROVIDER role accounts)
 */
export const providerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Retrieve user with password hash
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Role validation: Partner login is strictly for providers
  if (user.role !== "PROVIDER") {
    throw new ApiError(
      403,
      "Access denied: This login portal is for tiffin service partners only",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Your account is ${user.status.toLowerCase()}. Please contact administrator support.`,
    );
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if provider business profile already exists
  const providerProfile = await TiffinProvider.findOne({ userId: user._id });
  const stage = computeProviderStage(providerProfile);

  const token = generateToken({ id: user._id, role: user.role });

  // Set HTTP-only secure cookie
  res.cookie("providerToken", token, getCookieOptions());

  res.status(200).json({
    success: true,
    message: "Provider logged in successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      stage,
      providerProfile: providerProfile || null,
    },
  });
});

/**
 * @desc    Step 2 of 2 — Complete Onboarding Wizard (Create Business Profile)
 * @route   POST /api/provider/onboarding (or /api/provider/profile)
 * @access  Private (Provider only)
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
  const {
    businessName,
    contactNumber,
    address,
    city,
    serviceArea,
    foodType,
    description,
    imageUrl,
  } = req.body;

  // Check if profile was already created
  const existingProfile = await TiffinProvider.findOne({
    userId: req.user._id,
  });

  if (existingProfile) {
    throw new ApiError(
      409,
      "An onboarding profile has already been submitted for this account. Current status: " +
        existingProfile.verificationStatus,
    );
  }

  // Basic validation
  if (!businessName || !address || !city) {
    throw new ApiError(
      400,
      "Please provide all required business details: businessName, address, and city",
    );
  }

  // Service area normalization
  const normalizedServiceArea = Array.isArray(serviceArea)
    ? serviceArea.map((s) => String(s).trim()).filter(Boolean)
    : typeof serviceArea === "string"
      ? serviceArea
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const providerProfile = await TiffinProvider.create({
    userId: req.user._id,
    businessName: businessName.trim(),
    contactNumber: (contactNumber || req.user.phone).trim(),
    address: address.trim(),
    city: city.trim(),
    serviceArea: normalizedServiceArea,
    foodType: foodType || "BOTH",
    description: description?.trim(),
    imageUrl: imageUrl?.trim(),
    verificationStatus: "PENDING",
  });

  res.status(201).json({
    success: true,
    message: "Onboarding submitted successfully. Application is pending approval.",
    data: {
      providerProfile,
      stage: "PENDING_APPROVAL",
      verificationStatus: "PENDING",
    },
  });
});

/**
 * @desc    Get currently logged in provider profile & onboarding state
 * @route   GET /api/provider/me (or /api/provider/auth/me)
 * @access  Private (Provider only)
 */
export const getProviderProfile = asyncHandler(async (req, res) => {
  const providerProfile = await TiffinProvider.findOne({
    userId: req.user._id,
  });

  const stage = computeProviderStage(providerProfile);

  res.status(200).json({
    success: true,
    data: {
      user: req.user,
      stage,
      providerProfile: providerProfile || null,
    },
  });
});

/**
 * @desc    Provider logout / clear session cookie
 * @route   POST /api/provider/logout (or /api/provider/auth/logout)
 * @access  Public / Private
 */
export const providerLogout = asyncHandler(async (req, res) => {
  res.clearCookie("providerToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Provider logged out successfully",
  });
});

/**
 * @desc    Provider celebrates/acknowledges approval milestone and unlocks permanent dashboard access
 * @route   PATCH /api/provider/acknowledge-approval
 * @access  Private (Provider only)
 */
export const acknowledgeApproval = asyncHandler(async (req, res) => {
  const providerProfile = await TiffinProvider.findOne({
    userId: req.user._id,
  });

  if (!providerProfile) {
    throw new ApiError(404, "Provider profile not found");
  }

  if (providerProfile.verificationStatus !== "VERIFIED") {
    throw new ApiError(
      400,
      `Cannot acknowledge approval. Current verification status is "${providerProfile.verificationStatus}".`,
    );
  }

  // Set milestone acknowledged flag to true
  providerProfile.hasAcknowledgedApproval = true;
  await providerProfile.save();

  res.status(200).json({
    success: true,
    message: "Approval milestone acknowledged! Kitchen dashboard access unlocked.",
    data: {
      stage: "VERIFIED",
      providerProfile,
    },
  });
});

/**
 * @desc    Re-apply / resubmit onboarding for a rejected kitchen application
 * @route   PATCH /api/provider/reapply
 * @access  Private (Provider only)
 */
export const reapplyOnboarding = asyncHandler(async (req, res) => {
  const {
    businessName,
    contactNumber,
    address,
    city,
    serviceArea,
    foodType,
    description,
    imageUrl,
  } = req.body;

  const providerProfile = await TiffinProvider.findOne({
    userId: req.user._id,
  });

  if (!providerProfile) {
    throw new ApiError(404, "Provider profile not found");
  }

  if (providerProfile.verificationStatus !== "REJECTED") {
    throw new ApiError(
      400,
      `Can only re-apply if current application was rejected. Current status: "${providerProfile.verificationStatus}".`,
    );
  }

  // Update provided fields
  if (businessName) providerProfile.businessName = businessName.trim();
  if (contactNumber) providerProfile.contactNumber = contactNumber.trim();
  if (address) providerProfile.address = address.trim();
  if (city) providerProfile.city = city.trim();
  if (serviceArea) {
    providerProfile.serviceArea = Array.isArray(serviceArea)
      ? serviceArea.map((s) => String(s).trim()).filter(Boolean)
      : typeof serviceArea === "string"
        ? serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  }
  if (foodType) providerProfile.foodType = foodType;
  if (description !== undefined) providerProfile.description = description.trim();
  if (imageUrl !== undefined) providerProfile.imageUrl = imageUrl.trim();

  // Reset verification status back to PENDING and clear rejection info
  providerProfile.verificationStatus = "PENDING";
  providerProfile.rejectionReason = undefined;
  providerProfile.hasAcknowledgedApproval = false;
  await providerProfile.save();

  res.status(200).json({
    success: true,
    message: "Application resubmitted successfully. Operations team is reviewing.",
    data: {
      stage: "PENDING_APPROVAL",
      providerProfile,
    },
  });
});

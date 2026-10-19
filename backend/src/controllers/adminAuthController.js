import User from "../models/User.js";
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

/**
 * @desc    Register a new administrator
 * @route   POST /api/admin/auth/register
 * @access  Public (Protected by ADMIN_REGISTRATION_SECRET if defined)
 */
export const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password, adminSecretKey } = req.body;

  // Basic validation
  if (!name || !email || !phone || !password) {
    throw new ApiError(
      400,
      "Please provide all required fields: name, email, phone, password",
    );
  }

  // If ADMIN_REGISTRATION_SECRET is set in environment, enforce it for safety
  const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET;
  if (expectedSecret && adminSecretKey !== expectedSecret) {
    throw new ApiError(403, "Invalid admin registration secret key");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if an account already exists with this email or phone
  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email or phone already exists",
    );
  }

  // Create admin user (role strictly forced to ADMIN)
  const admin = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,
    role: "ADMIN",
    status: "ACTIVE",
  });

  const token = generateToken({ id: admin._id, role: admin.role });

  // Store JWT in HTTP-only secure cookie
  res.cookie("adminToken", token, getCookieOptions());

  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
      },
    },
  });
});

/**
 * @desc    Admin login
 * @route   POST /api/admin/auth/login
 * @access  Public (Restricted to ADMIN role accounts)
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password since it has select: false in schema
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid administrator credentials");
  }

  // Strict role check: Do not allow non-admin users to log in via admin portal
  if (user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "Access denied: This account does not have administrative privileges",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Admin account is ${user.status.toLowerCase()}. Access denied.`,
    );
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid administrator credentials");
  }

  const token = generateToken({ id: user._id, role: user.role });

  // Store JWT in HTTP-only secure cookie
  res.cookie("adminToken", token, getCookieOptions());

  res.status(200).json({
    success: true,
    message: "Admin logged in successfully",
    data: {
      admin: {
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
 * @desc    Admin logout / clear session cookie
 * @route   POST /api/admin/auth/logout
 * @access  Public / Private
 */
export const adminLogout = asyncHandler(async (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
});

/**
 * @desc    Get currently logged in admin profile
 * @route   GET /api/admin/auth/me
 * @access  Private (Admin only)
 */
export const getAdminProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      admin: req.user,
    },
  });
});

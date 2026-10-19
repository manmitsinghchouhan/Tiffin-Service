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
 * @desc    Register a new customer account
 * @route   POST /api/customer/auth/register (or /api/customer/register)
 * @access  Public
 */
export const customerRegister = asyncHandler(async (req, res) => {
  const { fullName, name, email, phone, password, confirmPassword } = req.body;
  const customerName = (fullName || name || "").trim();

  // Validate required fields
  if (!customerName || !email || !phone || !password || !confirmPassword) {
    throw new ApiError(
      400,
      "Please provide all required fields: full name, email, phone, password, and confirm password",
    );
  }

  // Verify passwords match
  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match");
  }

  // Password length validation
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  // Check for existing account with this email or phone
  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email or phone number already exists",
    );
  }

  // Create customer user (role strictly CUSTOMER)
  const customer = await User.create({
    name: customerName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    role: "CUSTOMER",
    status: "ACTIVE",
  });

  res.status(201).json({
    success: true,
    message: "Customer registered successfully. Please log in to continue.",
    data: {
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        status: customer.status,
      },
    },
  });
});

/**
 * @desc    Customer login
 * @route   POST /api/customer/auth/login (or /api/customer/login)
 * @access  Public (Restricted to CUSTOMER role accounts)
 */
export const customerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Retrieve user including password hash
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Role validation: Customer portal is specifically for customers
  if (user.role !== "CUSTOMER") {
    throw new ApiError(
      403,
      "Access denied: This login portal is for customers only",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Your account is ${user.status.toLowerCase()}. Please contact support.`,
    );
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({ id: user._id, role: user.role });

  // Set HTTP-only secure cookie
  res.cookie("customerToken", token, getCookieOptions());

  res.status(200).json({
    success: true,
    message: "Customer logged in successfully",
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
 * @desc    Customer logout / clear session cookie
 * @route   POST /api/customer/auth/logout (or /api/customer/logout)
 * @access  Public / Private
 */
export const customerLogout = asyncHandler(async (req, res) => {
  res.clearCookie("customerToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Customer logged out successfully",
  });
});

/**
 * @desc    Get currently logged in customer profile
 * @route   GET /api/customer/auth/me (or /api/customer/me)
 * @access  Private (Customer only)
 */
export const getCustomerProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

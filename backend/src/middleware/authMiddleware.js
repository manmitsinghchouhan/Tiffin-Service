import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

// Authenticate user via HTTP-only cookie or JWT Bearer Token
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  const url = req.originalUrl || req.url || "";

  // 1. Role-specific route matching for multi-role cookies in same browser
  if (url.includes("/admin")) {
    token = req.cookies?.adminToken;
  } else if (url.includes("/provider")) {
    token = req.cookies?.providerToken;
  } else if (url.includes("/customer")) {
    token = req.cookies?.customerToken;
  }

  // 2. Generic fallback across all cookies
  if (!token) {
    token =
      req.cookies?.providerToken ||
      req.cookies?.adminToken ||
      req.cookies?.customerToken ||
      req.cookies?.token;
  }

  // 3. Fallback to Bearer authorization header if present
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Authentication token is missing. Please log in.");
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "User belonging to this token no longer exists");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(403, `Account is ${user.status.toLowerCase()}. Access denied.`);
  }

  req.user = user;
  next();
});

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: requires one of the following roles: [${roles.join(", ")}]`,
        ),
      );
    }
    next();
  };
};

export const isAdmin = authorize("ADMIN");
export const isCustomer = authorize("CUSTOMER");
export const isProvider = authorize("PROVIDER");

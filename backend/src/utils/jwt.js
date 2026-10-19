import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  return process.env.JWT_SECRET || "fallback_super_secret_jwt_key";
};

export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

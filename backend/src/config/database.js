import mongoose from "mongoose";
import User from "../models/User.js";

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  // Reuse existing connection in serverless warm executions
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const mongoUri = uri || "mongodb://127.0.0.1:27017/tiffin_service";

  try {
    const conn = await mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
  }
};

// Auto-seed default Admin if deploying to a fresh database like MongoDB Atlas
export const ensureAdminExists = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@tiffinservice.com")
      .toLowerCase()
      .trim();

    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: "ADMIN" }],
    });

    if (!existingAdmin) {
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
      const newAdmin = await User.create({
        name: process.env.ADMIN_NAME || "System Administrator",
        email: adminEmail,
        phone: process.env.ADMIN_PHONE || "9999999999",
        password: adminPassword,
        role: "ADMIN",
        status: "ACTIVE",
      });
      console.log(`[Auto-Seed] Default Admin user created for fresh database: ${newAdmin.email}`);
    }
  } catch (err) {
    console.error("[Auto-Seed] Admin verification note:", err.message);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("[MongoDB] Disconnected successfully");
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};

export default connectDB;

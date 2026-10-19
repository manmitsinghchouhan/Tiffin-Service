import dotenv from "dotenv";
dotenv.config();

import { connectDB, disconnectDB } from "../config/database.js";
import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await connectDB();

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@tiffinservice.com")
      .toLowerCase()
      .trim();
    const adminPhone = (process.env.ADMIN_PHONE || "9999999999").trim();
    const adminName = process.env.ADMIN_NAME || "System Administrator";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

    // Check if an admin already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { phone: adminPhone }],
    });

    if (existingAdmin) {
      if (existingAdmin.role === "ADMIN") {
        console.log(
          `[Seed] Admin user already exists with email: ${existingAdmin.email}`,
        );
      } else {
        console.log(
          `[Seed] User with email ${existingAdmin.email} exists with role ${existingAdmin.role}. Promoting to ADMIN...`,
        );
        existingAdmin.role = "ADMIN";
        existingAdmin.status = "ACTIVE";
        await existingAdmin.save();
        console.log(`[Seed] User successfully promoted to ADMIN.`);
      }
    } else {
      console.log(`[Seed] Creating default Admin user...`);
      const newAdmin = await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: "ADMIN",
        status: "ACTIVE",
      });

      console.log(`[Seed] Admin successfully created:`);
      console.log(`   - Name:     ${newAdmin.name}`);
      console.log(`   - Email:    ${newAdmin.email}`);
      console.log(`   - Phone:    ${newAdmin.phone}`);
      console.log(`   - Role:     ${newAdmin.role}`);
      console.log(`   - Password: ${adminPassword}`);
    }

    console.log("[Seed] Seeding completed.");
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Failed to seed admin: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

seedAdmin();

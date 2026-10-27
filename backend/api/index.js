import app from "../src/app.js";
import { connectDB, ensureAdminExists } from "../src/config/database.js";

let adminEnsured = false;

export default async function handler(req, res) {
  try {
    await connectDB();

    if (!adminEnsured) {
      await ensureAdminExists();
      adminEnsured = true;
    }

    return app(req, res);
  } catch (err) {
    console.error("[Vercel Serverless Error]:", err);
    return res.status(500).json({
      success: false,
      message: "Serverless Database / Internal Error",
      error: err.message,
    });
  }
}

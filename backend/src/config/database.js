import mongoose from "mongoose";

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

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("[MongoDB] Disconnected successfully");
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};

export default connectDB;

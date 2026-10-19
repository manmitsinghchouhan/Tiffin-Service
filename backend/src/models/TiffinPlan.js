import mongoose from "mongoose";

const tiffinPlanSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinProvider",
      required: [true, "Provider ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [120, "Plan name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    durationDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
    },
    mealsPerDay: {
      type: Number,
      required: [true, "Meals per day is required"],
      min: [1, "Must offer at least 1 meal per day"],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    isSubscriptionAvailable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE"],
        message: "{VALUE} is not a valid plan status",
      },
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const TiffinPlan = mongoose.model("TiffinPlan", tiffinPlanSchema);

export default TiffinPlan;

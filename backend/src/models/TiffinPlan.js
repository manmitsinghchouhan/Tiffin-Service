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
      default: "",
    },
    durationDays: {
      type: Number,
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"],
      default: 30,
    },
    mealsPerDay: {
      type: Number,
      min: [1, "Must offer at least 1 meal per day"],
      default: 1,
    },
    mealType: {
      type: String,
      enum: {
        values: ["BREAKFAST", "LUNCH", "DINNER", "LUNCH_DINNER", "ALL_MEALS"],
        message: "{VALUE} is not a valid meal type",
      },
      default: "LUNCH",
      required: [true, "Meal type is required"],
    },
    diet: {
      type: String,
      enum: {
        values: ["VEG", "NON_VEG", "BOTH"],
        message: "{VALUE} is not a valid diet type",
      },
      default: "VEG",
      required: [true, "Diet classification is required"],
    },
    deliveryDays: {
      type: String,
      enum: {
        values: ["ALL_DAYS", "WEEKDAYS_ONLY", "MON_TO_SAT"],
        message: "{VALUE} is not a valid delivery schedule",
      },
      default: "ALL_DAYS",
    },
    features: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    isSubscriptionAvailable: {
      type: Boolean,
      default: true,
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
  }
);

// Compound index for querying active plans per provider quickly
tiffinPlanSchema.index({ providerId: 1, status: 1 });

const TiffinPlan = mongoose.model("TiffinPlan", tiffinPlanSchema);

export default TiffinPlan;

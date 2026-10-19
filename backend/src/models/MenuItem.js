import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinPlan",
      required: [true, "Plan ID is required"],
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinProvider",
      required: [true, "Provider ID is required"],
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: {
        values: [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ],
        message: "{VALUE} is not a valid day of the week",
      },
      required: [true, "Day of week is required"],
    },
    mealType: {
      type: String,
      enum: {
        values: ["BREAKFAST", "LUNCH", "DINNER"],
        message: "{VALUE} is not a valid meal type",
      },
      required: [true, "Meal type is required"],
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [120, "Item name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE"],
        message: "{VALUE} is not a valid status",
      },
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient weekly menu lookups
menuItemSchema.index({ planId: 1, dayOfWeek: 1, mealType: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;

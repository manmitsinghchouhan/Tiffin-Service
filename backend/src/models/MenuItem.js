import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinPlan",
      required: false,
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
    diet: {
      type: String,
      enum: {
        values: ["Veg", "Non-Veg"],
        message: "{VALUE} is not a valid dietary type",
      },
      default: "Veg",
    },
    timing: {
      type: String,
      trim: true,
      default: "",
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

// Compound indexes for efficient weekly menu lookups per provider or per plan
menuItemSchema.index({ providerId: 1, dayOfWeek: 1, mealType: 1 });
menuItemSchema.index({ planId: 1, dayOfWeek: 1, mealType: 1 }, { sparse: true });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;

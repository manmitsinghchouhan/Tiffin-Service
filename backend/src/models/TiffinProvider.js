import mongoose from "mongoose";

const tiffinProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Provider user ID is required"],
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [150, "Business name cannot exceed 150 characters"],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    serviceArea: {
      type: [String],
      default: [],
    },
    foodType: {
      type: String,
      enum: {
        values: ["VEG", "NON_VEG", "BOTH"],
        message: "{VALUE} is not a valid food type",
      },
      required: [true, "Food type is required"],
      default: "BOTH",
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ["PENDING", "VERIFIED", "REJECTED"],
        message: "{VALUE} is not a valid verification status",
      },
      default: "PENDING",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const TiffinProvider = mongoose.model("TiffinProvider", tiffinProviderSchema);

export default TiffinProvider;

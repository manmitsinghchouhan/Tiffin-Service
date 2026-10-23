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
    tagline: {
      type: String,
      trim: true,
      maxlength: [200, "Tagline cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true,
    },
    operatingStatus: {
      type: String,
      enum: {
        values: ["OPEN", "BUSY"],
        message: "{VALUE} is not a valid operating status",
      },
      default: "OPEN",
    },
    fssaiNumber: {
      type: String,
      trim: true,
      maxlength: [20, "FSSAI registration number cannot exceed 20 characters"],
    },
    fssaiExpiry: {
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
    verifiedAt: {
      type: Date,
    },
    hasAcknowledgedApproval: {
      type: Boolean,
      default: false,
    },
    settings: {
      orderTiming: {
        lunchCutoff: { type: String, default: "09:30 AM" },
        dinnerCutoff: { type: String, default: "04:30 PM" },
        lunchDeliveryWindow: { type: String, default: "12:00 PM - 01:30 PM" },
        dinnerDeliveryWindow: { type: String, default: "07:30 PM - 09:00 PM" },
        autoAcceptOrders: { type: Boolean, default: true },
      },
      notifications: {
        whatsappAlerts: { type: Boolean, default: true },
        emailDigest: { type: Boolean, default: true },
        customerPauseAlerts: { type: Boolean, default: true },
        lowPrepWarnings: { type: Boolean, default: true },
      },
      subscriptionPolicy: {
        pauseNoticeHours: { type: Number, default: 24 },
        defaultAutoRenew: { type: Boolean, default: true },
      },
      holidayMode: {
        enabled: { type: Boolean, default: false },
        startDate: { type: Date },
        endDate: { type: Date },
        reason: { type: String, default: "" },
      },
    },
  },
  {
    timestamps: true,
  },
);

const TiffinProvider = mongoose.model("TiffinProvider", tiffinProviderSchema);

export default TiffinProvider;

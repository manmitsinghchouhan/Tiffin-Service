import mongoose from "mongoose";

const planSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    mealsPerDay: { type: Number, required: true, default: 1 },
    mealType: { type: String, default: "LUNCH" },
    diet: { type: String, default: "VEG" },
    deliveryDays: { type: String, default: "ALL_DAYS" },
    features: { type: [String], default: [] },
  },
  { _id: false },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const deliveryHistorySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // e.g. "2026-10-23"
    deliveredAt: { type: Date, default: Date.now },
    mealType: { type: String, default: "LUNCH" },
    status: {
      type: String,
      enum: ["DELIVERED", "SKIPPED"],
      default: "DELIVERED",
    },
    deliveryAddress: { type: deliveryAddressSchema },
    notes: { type: String, default: "" },
  },
  { _id: true },
);

const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinProvider",
      required: [true, "Provider ID is required"],
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinPlan",
      required: [true, "Plan ID is required"],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, "Delivery address is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    planSnapshot: {
      type: planSnapshotSchema,
      required: [true, "Plan snapshot is required"],
    },
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "ACTIVE", "PAUSED", "EXPIRED", "CANCELLED"],
        message: "{VALUE} is not a valid subscription status",
      },
      default: "ACTIVE",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledBy: {
      type: String,
      enum: ["PROVIDER", "CUSTOMER", "SYSTEM", ""],
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    todayDispatchStatus: {
      status: {
        type: String,
        enum: ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"],
        default: "PREPARING",
      },
      date: {
        type: String,
        default: "",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    deliveryHistory: {
      type: [deliveryHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;


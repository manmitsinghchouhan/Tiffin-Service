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

const orderSchema = new mongoose.Schema(
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
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
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
    // Immutable snapshot of plan details at the time of purchase
    planSnapshot: {
      type: planSnapshotSchema,
      required: [true, "Plan snapshot is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"],
        message: "{VALUE} is not a valid order status",
      },
      default: "PENDING",
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

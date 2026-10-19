import mongoose from "mongoose";

const planSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    mealsPerDay: { type: Number, required: true },
  },
  { _id: false },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    landmark: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
  },
  { _id: false },
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
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "EXPIRED", "CANCELLED"],
        message: "{VALUE} is not a valid subscription status",
      },
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["CARD", "UPI", "NETBANKING", "CASH", "WALLET"],
        message: "{VALUE} is not a valid payment method",
      },
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "SUCCESS", "FAILED"],
        message: "{VALUE} is not a valid payment status",
      },
      default: "PENDING",
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Data-integrity check: Exactly one of orderId or subscriptionId must be present
paymentSchema.pre("validate", function () {
  const hasOrder = Boolean(this.orderId);
  const hasSubscription = Boolean(this.subscriptionId);

  if ((hasOrder && hasSubscription) || (!hasOrder && !hasSubscription)) {
    this.invalidate(
      "orderId",
      "A payment must be linked to either an order or a subscription, but not both or neither.",
    );
  }
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

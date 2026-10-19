import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["FEEDBACK", "COMPLAINT"],
        message: "{VALUE} is not a valid feedback type",
      },
      default: "FEEDBACK",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["OPEN", "REVIEWED", "RESOLVED"],
        message: "{VALUE} is not a valid feedback status",
      },
      default: "OPEN",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;

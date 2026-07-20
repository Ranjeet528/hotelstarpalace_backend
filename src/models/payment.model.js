import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ==========================
    // PAYMENT ID (RAZORPAY)
    // ==========================
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ==========================
    // ORDER ID (RAZORPAY)
    // ==========================
    orderId: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================
    // BOOKING REFERENCE
    // ==========================
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
       default: null,
    },

    // ==========================
    // CUSTOMER DETAILS
    // ==========================
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    // ==========================
    // PAYMENT AMOUNT
    // ==========================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ==========================
    // PAYMENT GATEWAY
    // ==========================
    gateway: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      default: "razorpay",
    },

    // ==========================
    // PAYMENT METHOD
    // ==========================
    method: {
      type: String,
      default: "online",
    },

    // ==========================
    // PAYMENT STATUS
    // ==========================
    status: {
      type: String,
      enum: [
        "created",
        "success",
        "failed",
        "refunded",
      ],
      default: "created",
    },

    // ==========================
    // RAZORPAY SIGNATURE
    // ==========================
    signature: {
      type: String,
      default: "",
    },

    // ==========================
    // INVOICE
    // ==========================
    invoiceNumber: {
      type: String,
      default: "",
    },

    // ==========================
    // REFUND
    // ==========================
    refundStatus: {
      type: String,
      enum: [
        "not_requested",
        "requested",
        "approved",
        "processing",
        "refunded",
        "rejected",
      ],
      default: "not_requested",
    },
    failureReason: {
  type: String,
  default: "",
},

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundId: {
      type: String,
      default: "",
    },

    refundReason: {
      type: String,
      default: "",
    },

    refundRequestedAt: {
      type: Date,
      default: null,
    },

    refundApprovedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundRejectedAt: {
      type: Date,
      default: null,
    },

    refundRejectedReason: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==========================
    // PAYMENT DATE
    // ==========================
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// INDEXES
// ==========================

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ refundStatus: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model(
  "Payment",
  paymentSchema
);
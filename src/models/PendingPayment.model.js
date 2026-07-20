import mongoose from "mongoose";

const pendingPaymentSchema = new mongoose.Schema(
  {
    // ==========================
    // CUSTOMER
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
    userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},

    // ==========================
    // ROOM
    // ==========================

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    // ==========================
    // GUESTS
    // ==========================

    adults: {
      type: Number,
      default: 2,
    },

    children: {
      type: Number,
      default: 0,
    },

    childrenAges: [
      {
        type: Number,
      },
    ],

    // ==========================
    // BOOKING
    // ==========================

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    specialRequest: {
      type: String,
      default: "",
    },

    // ==========================
    // PRICE
    // ==========================

    price: {
      type: Number,
      required: true,
    },

    nights: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    // ==========================
    // RAZORPAY
    // ==========================

    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ==========================
    // STATUS
    // ==========================

    status: {
      type: String,
      enum: [
        "created",
        "paid",
        "failed",
        "expired",
      ],
      default: "created",
    },

    // ==========================
    // EXPIRE AFTER 30 MINUTES
    // ==========================

    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + 30 * 60 * 1000),
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PendingPayment",
  pendingPaymentSchema
);
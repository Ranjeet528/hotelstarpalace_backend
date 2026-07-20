import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // ==========================
    // BOOKING ID
    // ==========================
    bookingId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
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
      trim: true,
      lowercase: true,
    },

    // ==========================
    // USER
    // ==========================
    // NOTE: OTA bookings won't have a real registered user, so this
    // can no longer be strictly required — made optional and default
    // to null; website bookings should still always pass a real userId
    // at the controller level.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
    // GUEST DETAILS
    // ==========================
    adults: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },

    children: {
      type: Number,
      default: 0,
      min: 0,
    },

    childrenAges: [
      {
        type: Number,
        min: 0,
        max: 10,
      },
    ],

    // ==========================
    // PRICING
    // ==========================
    // Per Night Price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Total Nights
    // NOTE: not required so admin "block room" bookings (which don't
    // have real nights/pricing) can still be created. Defaults to 0.
    nights: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final Amount
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Subtotal (Without GST)
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    // GST Percentage
    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    // GST Amount
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================
    // PAYMENT
    // ==========================
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partial",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "razorpay",
        "upi",
        "card",
        "net_banking",
        "online",
      ],
      default: null,
    },

    // FIX: these were missing before — booking.service.js and
    // payment.controller.js write to them, but without being
    // declared in the schema Mongoose was silently dropping them
    // (strict mode). This broke the duplicate-payment check in
    // verifyPayment (Booking.findOne({ paymentId })) since paymentId
    // was never actually persisted.
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    orderId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentSignature: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // BOOKING SOURCE
    // ==========================
    // Extended to include OTA channels coming through the channel
    // manager. Website/admin/walk_in/phone/whatsapp stay as-is.
    bookingSource: {
      type: String,
      enum: [
        "website",
        "admin",
        "walk_in",
        "phone",
        "whatsapp",
        "booking_com",
        "agoda",
        "makemytrip",
        "goibibo",
        "expedia",
        "channel_manager_other",
      ],
      default: "website",
    },

    // ==========================
    // CHANNEL MANAGER / OTA SYNC
    // ==========================

    // The OTA's own booking reference — used to detect duplicate
    // webhook deliveries (OTAs often retry) and to look up a booking
    // when the OTA sends a modify/cancel notification later.
    externalBookingId: {
      type: String,
      default: "",
      trim: true,
    },

    // Which platform this externalBookingId belongs to — needed
    // because two different OTAs could theoretically reuse an ID.
    externalPlatform: {
      type: String,
      enum: [
        "booking_com",
        "agoda",
        "makemytrip",
        "goibibo",
        "expedia",
        "other",
        "",
      ],
      default: "",
    },

    // Tracks whether this booking has been pushed back out to the
    // channel manager (relevant for website/admin bookings — those
    // need to be pushed OUT to close availability on OTAs).
    channelManagerSyncStatus: {
      type: String,
      enum: ["not_applicable", "pending", "synced", "failed"],
      default: "not_applicable",
    },

    channelManagerSyncError: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // DATES
    // ==========================
    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    // Check-in Time (saved from hotel settings)
    checkInTime: {
      type: String,
      default: "",
    },

    // Check-out Time (saved from hotel settings)
    checkOutTime: {
      type: String,
      default: "",
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedOutAt: {
      type: Date,
      default: null,
    },

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

    refundReason: {
      type: String,
      default: "",
    },

    refundRequestedAt: Date,

    refundApprovedAt: Date,

    refundedAt: Date,

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundId: {
      type: String,
      default: "",
    },

    refundRejectedReason: {
      type: String,
      default: "",
    },

    // ==========================
    // SPECIAL REQUEST
    // ==========================
    specialRequest: {
      type: String,
      default: "",
      trim: true,
    },

    // Admin Notes
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // FIX: booking.controller.js's blockRoomDates() writes a
    // `reason` field, but it didn't exist on the schema, so it was
    // being silently dropped on save.
    reason: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================
    // BOOKING STATUS
    // ==========================
    status: {
      type: String,
      enum: [
        "booked",
        "checked_in",
        "checked_out",
        "completed",
        "cancelled",
        "blocked",
        "no_show",
      ],
      default: "booked",
    },

    // ==========================
    // CANCELLATION DETAILS
    // ==========================

    cancelledBy: {
      type: String,
      enum: ["user", "admin", "system"],
      default: null,
    },

    cancelledByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// INDEXES
// ==========================

// Room availability
bookingSchema.index({
  roomId: 1,
  checkIn: 1,
  checkOut: 1,
});

// Status
bookingSchema.index({
  status: 1,
});

// Customer phone
bookingSchema.index({
  phone: 1,
});

// Check-In date
bookingSchema.index({
  checkIn: 1,
});

// Check-Out date
bookingSchema.index({
  checkOut: 1,
});

// Revenue reports
bookingSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

// Fast paymentId lookup (used for duplicate-payment checks)
bookingSchema.index({
  paymentId: 1,
});

// User Booking History
bookingSchema.index({
  userId: 1,
  createdAt: -1,
});

// Fast duplicate-detection for OTA webhook retries + lookup on
// modify/cancel notifications from the channel manager
bookingSchema.index(
  { externalBookingId: 1, externalPlatform: 1 },
  { sparse: true }
);

export default mongoose.model("Booking", bookingSchema);
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import PendingPayment from "../models/PendingPayment.model.js";
import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";
import Payment from "../models/payment.model.js";
import Setting from "../models/settings.model.js";

import { createBookingService } from "../services/booking.service.js";

// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/payments/create-order
// ==========================================
export const createOrder = async (req, res) => {
  try {

    const {
      customerName,
      phone,
      email,  

      adults = 2,
      children = 0,
      childrenAges = [],

      specialRequest,

      roomId,

      checkIn,
      checkOut,

    } = req.body;

    // ==========================
    // USER
    // ==========================

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    // ==========================
    // BASIC VALIDATION
    // ==========================

    if (!customerName || customerName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: "Room is required",
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in & Check-out are required",
      });
    }

    // ==========================
    // DATE PARSE
    // ==========================

    const inDate =
      checkIn instanceof Date
        ? new Date(checkIn)
        : String(checkIn).includes("T")
        ? new Date(checkIn)
        : new Date(checkIn + "T12:00:00");

    const outDate =
      checkOut instanceof Date
        ? new Date(checkOut)
        : String(checkOut).includes("T")
        ? new Date(checkOut)
        : new Date(checkOut + "T11:00:00");

    if (
      isNaN(inDate.getTime()) ||
      isNaN(outDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking dates",
      });
    }

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        message: "Checkout must be after check-in",
      });
    }

    inDate.setSeconds(0, 0);
    outDate.setSeconds(0, 0);

    // ==========================
    // ROOM
    // ==========================

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.status === "unavailable") {
      return res.status(400).json({
        success: false,
        message: "Room is unavailable",
      });
    }

    // ==========================
    // SETTINGS (GST)
    // ==========================

    const settings = await Setting.findOne();

    if (!settings) {
      return res.status(500).json({
        success: false,
        message: "Hotel settings not found",
      });
    }

    // ==========================
    // CHILD VALIDATION
    // ==========================

    if (
      Number(children) > 0 &&
      childrenAges.length !== Number(children)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select age for every child",
      });
    }

    if (
      childrenAges.some(
        (age) =>
          Number(age) < 0 ||
          Number(age) > 10
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid child age",
      });
    }

    // ==========================
    // ROOM CAPACITY
    // ==========================

    const chargeableChildren =
      childrenAges.filter(
        (age) => Number(age) >= 10
      ).length;

    const totalGuests =
      Number(adults) +
      chargeableChildren;

    if (totalGuests > room.capacity) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${room.capacity} guests allowed`,
      });
    }

    // ==========================
    // NIGHTS
    // ==========================

    const nights = Math.ceil(
      (outDate - inDate) /
        (1000 * 60 * 60 * 24)
    );

    // ==========================
    // PRICE + GST
    // ==========================

    const subtotal =
      room.price * nights;

    const gstPercentage =
      settings.gstPercentage || 0;

  const gstAmount = Number(
  ((subtotal * gstPercentage) / 100).toFixed(2)
);

const totalAmount = Number(
  (subtotal + gstAmount).toFixed(2)
);
    // ==========================
    // BLOCKED SLOT CHECK
    // ==========================

    const blocked =
      room.blockedSlots?.some(
        (slot) =>
          new Date(slot.start) < outDate &&
          new Date(slot.end) > inDate
      );

    if (blocked) {
      return res.status(400).json({
        success: false,
        message: "Room is blocked",
      });
    }

    // ==========================
    // BOOKING CONFLICT
    // ==========================

    const conflict =
      await Booking.findOne({

        roomId,

        status: {
          $in: [
            "booked",
            "checked_in",
          ],
        },

        $and: [
          {
            checkIn: {
              $lt: outDate,
            },
          },
          {
            checkOut: {
              $gt: inDate,
            },
          },
        ],

      });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message:
          "Room already booked for selected dates",
      });
    }    // ==========================
    // CREATE RAZORPAY ORDER
    // ==========================

    const order = await razorpay.orders.create({

      amount: Math.round(totalAmount * 100),

      currency: "INR",

      receipt: `receipt_${Date.now()}`,

      payment_capture: 1,

    });

    // ==========================
    // REMOVE OLD PENDING PAYMENT
    // ==========================

   await PendingPayment.deleteMany({

  userId,

  roomId,

  checkIn: inDate,

  checkOut: outDate,

  status:"created"

});

    // ==========================
    // SAVE PENDING PAYMENT
    // ==========================

    await PendingPayment.create({

      userId,

      customerName: customerName.trim(),

      phone: phone.trim(),

      email: email?.trim().toLowerCase() || "",

      roomId,

      adults: Number(adults),

      children: Number(children),

      childrenAges,

      specialRequest,

      checkIn: inDate,

      checkOut: outDate,

      price: room.price,

      nights,

      subtotal,

      gstPercentage,

      gstAmount,

      totalAmount,

      orderId: order.id,

      receipt: order.receipt,

      amount: order.amount,

      currency: order.currency,

      status: "created",

    });

    // ==========================
    // RESPONSE
    // ==========================

    return res.status(200).json({

      success: true,

      key: process.env.RAZORPAY_KEY_ID,

      order,

      booking: {

        customerName,

        phone,

        email,

        roomId,

        checkIn: inDate,

        checkOut: outDate,

        adults,

        children,

        childrenAges,

        nights,

        subtotal,

        gstPercentage,

        gstAmount,

        totalAmount,

      },

    });

  } catch (error) {

    console.error("Create Order Error:", error);

    return res.status(500).json({

      success: false,

      message: error.message || "Failed to create order",

    });

  }

};

// ==========================================
// VERIFY PAYMENT
// POST /api/payments/verify
// ==========================================
export const verifyPayment = async (req, res) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {

      return res.status(400).json({
        success: false,
        message: "Payment details missing",
      });

    }

    // ==========================
    // FIND PENDING PAYMENT
    // ==========================

  const pendingPayment = await PendingPayment.findOne({
  orderId: razorpay_order_id,
  userId: req.user._id,
});

    if (!pendingPayment) {

      return res.status(404).json({
        success: false,
        message: "Pending payment not found",
      });

    }

    // ==========================
    // DUPLICATE PAYMENT CHECK
    // ==========================

    const paymentExist = await Payment.findOne({
      paymentId: razorpay_payment_id,
    });

    if (paymentExist) {

      return res.status(409).json({
        success: false,
        message: "Payment already verified",
      });

    }

    const bookingExist = await Booking.findOne({
      paymentId: razorpay_payment_id,
    });

    if (bookingExist) {

      return res.status(409).json({
        success: false,
        message: "Booking already created",
        booking: bookingExist,
      });

    }

    // ==========================
    // VERIFY SIGNATURE
    // ==========================

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });

    }

    // ==========================
    // USER CHECK
    // ==========================

    if (!pendingPayment.userId) {

      return res.status(400).json({
        success: false,
        message: "User information missing",
      });

    }
        // ==========================
    // CREATE BOOKING
    // ==========================

    const booking = await createBookingService({

      userId: pendingPayment.userId,

      customerName: pendingPayment.customerName,

      phone: pendingPayment.phone,

      email: pendingPayment.email,

      roomId: pendingPayment.roomId,

      adults: pendingPayment.adults,

      children: pendingPayment.children,

      childrenAges: pendingPayment.childrenAges,

      specialRequest: pendingPayment.specialRequest,

      checkIn: pendingPayment.checkIn,

      checkOut: pendingPayment.checkOut,

      paymentStatus: "paid",

      paymentMethod: "razorpay",

      paymentId: razorpay_payment_id,

      orderId: razorpay_order_id,

      paymentSignature: razorpay_signature,

      bookingSource: "website",
      price: pendingPayment.price,

nights: pendingPayment.nights,

subtotal: pendingPayment.subtotal,

gstPercentage: pendingPayment.gstPercentage,

gstAmount: pendingPayment.gstAmount,

totalAmount: pendingPayment.totalAmount,

    });

    // ==========================
    // SAVE PAYMENT
    // ==========================

    const payment = await Payment.create({

      paymentId: razorpay_payment_id,

      orderId: razorpay_order_id,

      bookingId: booking._id,

      customerName: booking.customerName,

      phone: booking.phone,

      email: booking.email,

      amount: booking.totalAmount,

      currency: "INR",

      gateway: "razorpay",

      method: "online",

      status: "success",

      signature: razorpay_signature,

      paidAt: new Date(),

    });

    // ==========================
    // DELETE PENDING PAYMENT
    // ==========================

    await PendingPayment.findByIdAndDelete(
      pendingPayment._id
    );

    // ==========================
    // RESPONSE
    // ==========================

    return res.status(200).json({

      success: true,

      message: "Payment verified successfully",

      booking,

      payment,

    });

  } catch (error) {

    console.error("Verify Payment Error:", error);

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Payment verification failed",

    });

  }

};

// ==========================================
// GET REFUND REQUESTS
// GET /api/payments/refunds
// ==========================================
export const getRefundRequests = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
    } = req.query;

    const skip =
      (Number(page) - 1) * Number(limit);

    const filter = {
      refundStatus: "requested",
    };

    const total =
      await Payment.countDocuments(filter);

    const refunds = await Payment.find(filter)
      .populate({
        path: "bookingId",
        select:
          "bookingId customerName phone roomId checkIn checkOut totalAmount status refundReason",
        populate: {
          path: "roomId",
          select: "title roomType",
        },
      })
      .sort({
        refundRequestedAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: refunds,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(
          total / Number(limit)
        ),
      },
    });

  } catch (error) {

    console.error(
      "Get Refund Requests Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// ==========================================================
// APPROVE REFUND
// PUT /api/payments/:id/approve-refund
// ==========================================================
export const approveRefund = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Refund request hona chahiye
    if (payment.refundStatus !== "requested") {
      return res.status(400).json({
        success: false,
        message: "No refund request found",
      });
    }

    // FIX: req.body was undefined when the request had no JSON body
    // (frontend calls axios.put(url) with no second argument), which
    // made `req.body.amount` throw "Cannot read properties of
    // undefined (reading 'amount')". Optional-chain it instead.
    const refundAmount =
      req.body?.amount || payment.refundAmount || payment.amount;

    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund amount",
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed payment amount",
      });
    }

    // Mark as processing
    payment.refundStatus = "processing";
    payment.refundApprovedAt = new Date();
    await payment.save();

    // Razorpay refund API
    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: Math.round(refundAmount * 100), // paise
    });

    // Update payment
    payment.refundStatus = "refunded";
    payment.status = "refunded";
    payment.refundAmount = refundAmount;
    payment.refundId = refund.id;
    payment.refundedAt = new Date();

    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);

    if (booking) {
      booking.refundStatus = "refunded";
      booking.paymentStatus =
        refundAmount >= payment.amount ? "refunded" : "partial";
      booking.refundAmount = refundAmount;
      booking.refundedAt = new Date();

      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message: "Refund approved successfully",
      refund,
      payment,
    });
  } catch (error) {
    console.error("Approve Refund Error:", error);

    // Agar Razorpay refund fail ho gaya to payment status rollback
    const payment = await Payment.findById(req.params.id);

    if (payment && payment.refundStatus === "processing") {
      payment.refundStatus = "approved";
      await payment.save();
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Refund failed",
    });
  }
};

// ==========================================================
// REJECT REFUND
// PUT /api/payments/:id/reject-refund
// ==========================================================
export const rejectRefund = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Already refunded
    if (payment.refundStatus === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Refund already processed",
      });
    }

    // Refund request hona chahiye
    if (payment.refundStatus !== "requested") {
      return res.status(400).json({
        success: false,
        message: "No refund request found",
      });
    }

    // ==========================
    // UPDATE PAYMENT
    // ==========================
    payment.refundStatus = "rejected";
    payment.refundRejectedAt = new Date();

    // FIX: same undefined-req.body guard as approveRefund
    payment.refundRejectedReason =
      req.body?.reason || "Refund rejected by admin";

    payment.rejectedBy = req.user._id;

    await payment.save();

    // ==========================
    // UPDATE BOOKING
    // ==========================
    const booking = await Booking.findById(payment.bookingId);

    if (booking) {
      booking.refundStatus = "rejected";
      booking.refundRejectedReason = payment.refundRejectedReason;

      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message: "Refund request rejected successfully",
      payment,
    });
  } catch (error) {
    console.error("Reject Refund Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PAYMENT
// GET /api/payments/:id
// ==========================================
export const getPaymentById = async (req, res) => {
  try {

    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "bookingId",
        populate: {
          path: "roomId",
          select: "title roomType images price capacity",
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });

  } catch (error) {

    console.error(
      "Get Payment Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==========================================================
// GET ALL PAYMENTS (Admin)
// GET /api/payments
// ==========================================================
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      refundStatus,
      search,
      from,
      to,
    } = req.query;

    const filter = {};

    // FIX: previously `status !== "all"` treated an empty string ("")
    // as a real filter value, matching zero documents. Now an empty/
    // missing value is simply skipped, same as "no filter selected".
    if (status && status !== "all") {
      filter.status = status;
    }

    if (refundStatus && refundStatus !== "all") {
      filter.refundStatus = refundStatus;
    }

    // FIX: "search" was being sent by the frontend but never used here.
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } },
      ];
    }

    // FIX: "from"/"to" were being sent by the frontend but never used here.
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .populate({
        path: "bookingId",
        select:
          "bookingId customerName phone roomId checkIn checkOut totalAmount status",
        populate: {
          path: "roomId",
          select: "title roomType",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get Payments Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================================
// PAYMENT DASHBOARD
// GET /api/payments/dashboard
// ==========================================================
export const paymentDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // ==========================
    // COUNTS
    // ==========================
   // ==========================
// COUNTS
// ==========================
const totalPayments = await Payment.countDocuments();

const successfulPayments = await Payment.countDocuments({
  status: "success",
});

const failedPayments = await Payment.countDocuments({
  status: "failed",
});

const pendingRefunds = await Payment.countDocuments({
  refundStatus: "requested",
});

const refundedPayments = await Payment.countDocuments({
  refundStatus: "refunded",
});

    // ==========================
    // REVENUE
    // ==========================
    const totalRevenueData = await Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const todayRevenueData = await Payment.aggregate([
      {
        $match: {
          status: "success",
          paidAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const monthRevenueData = await Payment.aggregate([
      {
        $match: {
          status: "success",
          paidAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // ==========================
    // REFUND AMOUNT (already refunded)
    // ==========================
    const refundAmountData = await Payment.aggregate([
      { $match: { refundStatus: "refunded" } },
      { $group: { _id: null, total: { $sum: "$refundAmount" } } },
    ]);

    // ==========================
    // FIX: this was missing entirely — the frontend stats card
    // "Pending Refund" was reading `stats.pendingRefundAmount`,
    // which the dashboard endpoint never returned.
    // ==========================
    const pendingRefundAmountData = await Payment.aggregate([
      { $match: { refundStatus: "requested" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,

     dashboard: {
  totalRevenue: totalRevenueData[0]?.total || 0,
  todayRevenue: todayRevenueData[0]?.total || 0,
  monthRevenue: monthRevenueData[0]?.total || 0,

  totalPayments,
  successfulPayments,
  failedPayments,
  refundedPayments,
  pendingRefunds,

  totalRefundAmount: refundAmountData[0]?.total || 0,
  pendingRefundAmount: pendingRefundAmountData[0]?.total || 0,
},
    });
  } catch (error) {
    console.error("Payment Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
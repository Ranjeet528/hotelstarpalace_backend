import {
  customerBookingTemplate,
  adminBookingTemplate,
} from "../utils/whatsappTemplates.js";

import {
  sendCustomerWhatsApp,
  sendAdminWhatsApp,
} from "../services/whatsapp.service.js";

import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";
import Payment from "../models/payment.model.js";
import Setting from "../models/settings.model.js";
import crypto from "crypto";
import { updateInventory } from "../services/inventory.service.js";


import { createBookingService } from "../services/booking.service.js";

// =============================
// 🔍 CHECK AVAILABILITY
// =============================
export const checkAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    // =========================
    // VALIDATION
    // =========================
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid dates",
      });
    }

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        message: "Checkout must be after check-in",
      });
    }

    // =========================
    // CONFLICT CHECK
    // FIX: also consider "checked_in" bookings, not just "booked",
    // otherwise a room with a guest currently checked in would
    // incorrectly show as available.
    // =========================
    const conflict =
      await Booking.findOne({
        roomId,

        status: {
          $in: [
            "booked",
            "checked_in",
            "blocked"
          ]
        },

        $and: [
          {
            checkIn: {
              $lt: outDate
            }
          },
          {
            checkOut: {
              $gt: inDate
            }
          }
        ]
      });

    return res.json({
      success: true,
      available: !conflict,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =============================
// ✅ CREATE BOOKING
// =============================
export const createBooking = async (req, res) => {
  try {

    const booking = await createBookingService({

      ...req.body,

      userId: req.user._id,

      paymentStatus: "pending",

      paymentMethod: "online",

      paymentId: "",

      orderId: "",

      paymentSignature: "",

    });

    return res.status(201).json({

      success: true,

      message: "Booking created successfully",

      data: booking,

    });

  } catch (error) {

    console.log(
      "Create Booking Error:",
      error
    );

    return res.status(400).json({

      success: false,

      message: error.message,

    });

  }
};

// =============================
// 📋 GET ALL BOOKINGS
// =============================
export const getAllBookings = async (req, res) => {
  try {
    const {
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    if (status !== "all") {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate("roomId")
      .populate("cancelledByUser", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      data: bookings,

      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// 📄 GET SINGLE BOOKING
// =============================
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("roomId")
      .populate("cancelledByUser", "name email role");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ==========================
    // USER CAN VIEW ONLY OWN BOOKING
    // ==========================
    if (
      req.user.role === "user" &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Admin & Superadmin can view any booking
    return res.status(200).json({
      success: true,
      data: booking,
    });

  } catch (error) {
    console.log("Get Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// ❌ CANCEL BOOKING
// =============================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Only booked reservations can be cancelled",
      });
    }

    // ==========================
    // CANCEL BOOKING
    // ==========================
    booking.status = "cancelled";
    booking.cancelledBy = "user";
    booking.cancelledByUser = req.user._id;
    booking.cancelledAt = new Date();
    booking.cancelReason = "Cancelled by customer";

    // ==========================
    // REFUND REQUEST (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {
      booking.refundStatus = "requested";
      booking.refundRequestedAt = new Date();
      booking.refundReason =
        req.body.reason || "Cancelled by customer";
      booking.refundAmount = booking.totalAmount;
    }

    await booking.save();

    try {
  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "release"
  );
} catch (err) {
  console.log("Inventory Release Error:", err.message);
}

    // ==========================
    // UPDATE PAYMENT (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {

      const payment = await Payment.findOne({
        bookingId: booking._id,
      });

      if (payment) {
        payment.refundStatus = "requested";
        payment.refundRequestedAt = new Date();
        payment.refundReason = booking.refundReason;
        payment.refundAmount = booking.totalAmount;

        await payment.save();
      }

    }

    // ==========================
    // FREE ROOM IF NO ACTIVE BOOKING
    // ==========================
    const activeBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: {
        $in: ["booked", "checked_in"],
      },
    });

    if (!activeBooking) {
      await Room.findByIdAndUpdate(
        booking.roomId,
        {
          status: "available",
        }
      );
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });

  } catch (error) {
    console.log("CANCEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled",
      });
    }

    // ==========================
    // CANCEL BOOKING
    // ==========================
    booking.status = "cancelled";
    booking.cancelledBy = "admin";
    booking.cancelledByUser = req.user._id;
    booking.cancelledAt = new Date();
    booking.cancelReason =
      req.body.reason || "Cancelled by admin";

    // ==========================
    // REFUND REQUEST (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {

      booking.refundStatus = "requested";
      booking.refundRequestedAt = new Date();
      booking.refundReason =
        req.body.reason || "Cancelled by admin";
      booking.refundAmount = booking.totalAmount;

    }

    await booking.save();

    try {
  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "release"
  );
} catch (err) {
  console.log("Inventory Release Error:", err.message);
}

    // ==========================
    // UPDATE PAYMENT (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {

      const payment = await Payment.findOne({
        bookingId: booking._id,
      });

      if (payment) {
        payment.refundStatus = "requested";
        payment.refundRequestedAt = new Date();
        payment.refundReason = booking.refundReason;
        payment.refundAmount = booking.totalAmount;

        await payment.save();
      }

    }

    // ==========================
    // FREE ROOM IF NO ACTIVE BOOKING
    // ==========================
    const activeBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: {
        $in: ["booked", "checked_in"],
      },
    });

    const blockedBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: "blocked",
    });

    if (!activeBooking && !blockedBooking) {
      await Room.findByIdAndUpdate(
        booking.roomId,
        {
          status: "available",
        }
      );
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });

  } catch (error) {
    console.log("Admin Cancel Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// ✅ COMPLETE BOOKING
// =============================
export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 1. mark completed
    booking.status = "completed";

    booking.checkedOutAt = new Date();

    await booking.save();

    try {
  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "release"
  );
} catch (err) {
    console.log(err.message);
}

    // 2. check if ANY active booking still exists for same room
    const activeBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: { $in: ["booked", "checked_in"] },
    });

    // 3. ONLY if no active booking → room can be free
    if (!activeBooking) {
      await Room.findByIdAndUpdate(booking.roomId, {
        status: "available",
      });
    }

    return res.json({
      success: true,
      message: "Booking completed",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// 🚫 BLOCK ROOM DATES
// =============================
export const blockRoomDates = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, reason } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (isNaN(inDate) || isNaN(outDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dates"
      });
    }

    // FIX: also block against "checked_in" bookings, not just
    // "booked"/"blocked", otherwise admin could block dates that
    // overlap with a guest who is currently checked in.
    const conflict = await Booking.findOne({
      roomId,
      status: { $in: ["booked", "checked_in", "blocked"] },
      $and: [
        { checkIn: { $lt: outDate } },
        { checkOut: { $gt: inDate } },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Room already booked/blocked"
      });
    }

    const blockedBooking = await Booking.create({
      bookingId:
        "BLOCK-" +
        crypto.randomBytes(4)
          .toString("hex")
          .toUpperCase(),

      userId: req.user._id,

      customerName: "Blocked",
      phone: "0000000000",

      roomId,

      price: 0,

      checkIn: inDate,
      checkOut: outDate,

      status: "blocked",

      reason: reason || "Blocked by admin",

      bookingSource: "admin",
    });

   try {
  await updateInventory(
    roomId,
    inDate,
    outDate,
    "block"
  );
} catch (err) {
  console.log("Inventory Block Error:", err.message);
}

    return res.status(201).json({
      success: true,
      message: "Room blocked successfully",
      data: blockedBooking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================
// ✅ CHECK-IN BOOKING
// =============================
export const checkInBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("roomId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Only booked reservations can be checked in",
      });
    }
    if (new Date() < new Date(booking.checkIn)) {
      return res.status(400).json({
        success: false,
        message: "Check-in date has not arrived yet",
      });
    }

    booking.status = "checked_in";
    booking.checkedInAt = new Date();

    await booking.save();

    await Room.findByIdAndUpdate(
      booking.roomId._id,
      {
        status: "unavailable",
      }
    );

    return res.json({
      success: true,
      message: "Guest checked in successfully",
      data: booking,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// ✅ CHECK-OUT BOOKING
// =============================
export const checkOutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "checked_in") {
      return res.status(400).json({
        success: false,
        message: "Guest has not checked in yet",
      });
    }

    booking.status = "completed";
    booking.checkedOutAt = new Date();

    await booking.save();

    try {
  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "release"
  );
} catch (err) {
  console.log(err.message);
}

    // Check if room has any active booking
    const activeBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: {
        $in: ["booked", "checked_in"],
      },
    });

    if (!activeBooking) {
      await Room.findByIdAndUpdate(
        booking.roomId,
        {
          status: "available",
        }
      );
    }

    return res.json({
      success: true,
      message: "Guest checked out successfully",
      data: booking,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ============================================
// GET USER BOOKINGS
// ============================================

export const getMyBookings = async (req, res) => {

  try {

    const userId = req.user._id;


    const bookings = await Booking.find({

      userId,

    })
      .populate(
        "roomId",
        "title images roomType price"
      )

      .populate(
        "cancelledByUser",
        "name"
      )
      .sort({
        createdAt: -1
      });



    return res.status(200).json({

      success: true,

      bookings,

    });


  }
  catch (error) {

    console.log(
      "My Booking Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message: error.message,

    });


  }

};

// ============================================
// TRACK GUEST BOOKING
// ============================================
export const trackGuestBooking = async (req, res) => {
  try {
    const { bookingId, phone } = req.body;

    if (!bookingId || !phone) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and phone are required",
      });
    }

    const booking = await Booking.findOne({
      bookingId: bookingId.trim().toUpperCase(),
      phone: phone.trim(),
    }).populate(
      "roomId",
      "title roomType images price"
    )
      .populate(
        "cancelledByUser",
        "name email role"
      )

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CANCEL GUEST BOOKING
// ============================================
export const cancelGuestBooking = async (req, res) => {
  try {
    const { bookingId, phone } = req.body;

    const booking = await Booking.findOne({
      bookingId: bookingId.trim().toUpperCase(),
      phone: phone.trim(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled",
      });
    }

    // ==========================
    // CANCEL BOOKING
    // ==========================
    booking.status = "cancelled";
    booking.cancelledBy = "user";
    booking.cancelledAt = new Date();
    booking.cancelReason = "Cancelled by customer (Guest Tracking)";

    // ==========================
    // REFUND REQUEST (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {
      booking.refundStatus = "requested";
      booking.refundRequestedAt = new Date();
      booking.refundReason =
        "Cancelled by customer (Guest Tracking)";
      booking.refundAmount = booking.totalAmount;
    }

    await booking.save();

    try {
  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "release"
  );
} catch (err) {
  console.log("Inventory Release Error:", err.message);
}

    // ==========================
    // UPDATE PAYMENT (ONLY PAID)
    // ==========================
    if (booking.paymentStatus === "paid") {

      const payment = await Payment.findOne({
        bookingId: booking._id,
      });

      if (payment) {
        payment.refundStatus = "requested";
        payment.refundRequestedAt = new Date();
        payment.refundReason = booking.refundReason;
        payment.refundAmount = booking.totalAmount;

        await payment.save();
      }

    }

    // ==========================
    // FREE ROOM IF NO ACTIVE BOOKING
    // ==========================
    const activeBooking = await Booking.findOne({
      roomId: booking.roomId,
      status: {
        $in: ["booked", "checked_in"],
      },
    });

    if (!activeBooking) {
      await Room.findByIdAndUpdate(
        booking.roomId,
        {
          status: "available",
        }
      );
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });

  } catch (error) {
    console.log("Guest Cancel Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET BOOKING INVOICE
// ============================================
export const getBookingInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate(
        "roomId",
        "title roomType price capacity images"
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // User sirf apni invoice dekh sakta hai
    if (
      req.user.role === "user" &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
    });

    const settings = await Setting.findOne();

    return res.status(200).json({
      success: true,

      booking: {
        ...booking.toObject(),

        paymentStatus:
          payment?.status === "success"
            ? "paid"
            : "pending",

        paymentMethod:
          payment?.method || "",

        paymentId:
          payment?.paymentId || "",

        orderId:
          payment?.orderId || "",
      },

      hotel: {
        name:
          settings?.hotelName || "Hotel Star Palace",

        address:
          settings?.address || "",

        phone:
          settings?.phone || "",

        email:
          settings?.email || "",

        website:
          settings?.website || "",

        gstNumber:
          settings?.gstNumber || "",

        logo:
          settings?.logo || "",
      },
    });

  } catch (error) {

    console.error(
      "Invoice Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};  
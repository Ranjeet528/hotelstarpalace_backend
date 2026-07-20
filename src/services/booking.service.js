import Booking from "../models/booking.model.js";
import Room from "../models/room.model.js";
import Setting from "../models/settings.model.js";
import crypto from "crypto";
import mongoose from "mongoose";
import { updateInventory } from "./inventory.service.js";

import {
  customerBookingTemplate,
  adminBookingTemplate,
} from "../utils/whatsappTemplates.js";

import {
  sendCustomerWhatsApp,
  sendAdminWhatsApp,
} from "./whatsapp.service.js";

// ==============================
// BOOKING ID GENERATOR
// ==============================
const generateBookingId = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SP-${year}-${random}`;
};

// ======================================
// CREATE BOOKING SERVICE
// ======================================


export const createBookingService = async (data) => {

  const {

    userId,

    customerName,
    phone,
    email,

    adults,
    children,
    childrenAges,

    specialRequest,

    roomId,

    checkIn,
    checkOut,

    price,
    nights,
    totalAmount,

    paymentStatus = "paid",
    paymentMethod = "razorpay",

    paymentId = "",
    orderId = "",
    paymentSignature = "",

    bookingSource = "website",

  } = data;

  // ==========================
  // BASIC VALIDATION
  // ==========================

  if (!userId) {
    throw new Error("User not found");
  }

  if (!customerName || customerName.trim().length < 3) {
    throw new Error("Please enter a valid customer name");
  }

  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    throw new Error("Please enter a valid phone number");
  }

  if (!roomId) {
    throw new Error("Room not found");
  }

  // ==========================
  // DATE VALIDATION
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
    throw new Error("Invalid booking dates");
  }

  if (outDate <= inDate) {
    throw new Error("Checkout must be after check-in");
  }

  inDate.setSeconds(0, 0);
  outDate.setSeconds(0, 0);

  // ==========================
  // ROOM FETCH
  // ==========================

  const room = await Room.findById(roomId);

  // ==========================
  // HOTEL SETTINGS
  // ==========================

  const settings = await Setting.findOne();

  if (!settings) {
    throw new Error("Hotel settings not found");
  }

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.status === "unavailable") {
    throw new Error("Room is unavailable");
  }

  // ==========================
  // CHILDREN VALIDATION
  // ==========================

  if (
    Number(children) > 0 &&
    (!childrenAges ||
      childrenAges.length !== Number(children))
  ) {
    throw new Error("Please select age for every child");
  }

  if (
    childrenAges?.some(
      age =>
        Number(age) < 0 ||
        Number(age) > 10
    )
  ) {
    throw new Error("Child age must be between 0 and 10 years");
  }

  // ==========================
  // ROOM CAPACITY
  // ==========================

  const chargeableChildren =
    (childrenAges || [])
      .filter(age => Number(age) >= 10)
      .length;

  const totalGuests =
    Number(adults || 2) + chargeableChildren;

  if (totalGuests > room.capacity) {
    throw new Error(
      `Maximum ${room.capacity} guests allowed`
    );
  }

  // ==========================
  // NIGHTS
  // ==========================

  const roomPrice = price ?? room.price;

  const totalNights =
    nights ??
    Math.ceil(
      (outDate - inDate) / (1000 * 60 * 60 * 24)
    );

  const subtotalAmount =
    data.subtotal ?? roomPrice * totalNights;

  const gst =
    data.gstPercentage ?? settings.gstPercentage ?? 0;

  const gstValue =
    data.gstAmount ??
    Number(((subtotalAmount * gst) / 100).toFixed(2));

  const grandTotal =
    data.totalAmount ??
    Number((subtotalAmount + gstValue).toFixed(2));

  // ==========================
  // BLOCKED SLOT CHECK
  // (safe to do outside transaction — blockedSlots are admin-set,
  // not subject to the same concurrent-write race as bookings)
  // ==========================

  const isBlocked =
    room.blockedSlots?.some(
      slot =>
        new Date(slot.start) < outDate &&
        new Date(slot.end) > inDate
    );

  if (isBlocked) {
    throw new Error("Room is blocked by admin");
  }

  // ==========================
  // BOOKING ID
  // ==========================

  const bookingId = generateBookingId();

  // ==========================
  // CONFLICT CHECK + CREATE
  // (wrapped in a transaction so two simultaneous requests for the
  // same room/dates can't both pass the conflict check and both
  // create a booking — the second one will fail cleanly instead)
  // ==========================

  const session = await mongoose.startSession();
  let booking;

  try {
    await session.withTransaction(async () => {

      const conflict = await Booking.findOne({
        roomId,
        status: { $in: ["booked", "checked_in"] },
        $and: [
          { checkIn: { $lt: outDate } },
          { checkOut: { $gt: inDate } },
        ],
      }).session(session);

      if (conflict) {
        throw new Error("Room already booked for selected dates");
      }

      const created = await Booking.create(
        [
          {
            bookingId,

            userId,

            customerName,
            phone,
            email,

            roomId,

            adults: Number(adults || 2),
            children: Number(children || 0),
            childrenAges: childrenAges || [],

            price: roomPrice,
            nights: totalNights,
            subtotal: subtotalAmount,

            gstPercentage: gst,
            gstAmount: gstValue,

            totalAmount: grandTotal,
            checkInTime: settings.checkInTime,
            checkOutTime: settings.checkOutTime,

            paymentStatus,
            paymentMethod,

            paymentId,
            orderId,
            paymentSignature,

            bookingSource,

            checkIn: inDate,
            checkOut: outDate,

            specialRequest,

            status: "booked",
          },
        ],
        { session }
      );

      booking = created[0];
    });
  } finally {
    session.endSession();
  }

  // ==========================
  // POPULATE ROOM
  // ==========================

  await booking.populate("roomId");
  // ==========================
// UPDATE CHANNEL INVENTORY
// ==========================

try {

  await updateInventory(
    booking.roomId,
    booking.checkIn,
    booking.checkOut,
    "book"
  );

} catch (error) {

  console.log(
    "Inventory Sync Error:",
    error.message
  );

}

await booking.populate("roomId");

  // ==========================
  // WHATSAPP NOTIFICATION
  // ==========================

  try {

    const customerMessage = customerBookingTemplate({
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      roomTitle: booking.roomId?.title || "Room",
      roomType: booking.roomId?.roomType || "",
      checkIn: inDate.toLocaleDateString("en-IN"),
      checkOut: outDate.toLocaleDateString("en-IN"),
      adults: booking.adults,
      children: booking.children,
      total: booking.totalAmount,
    });

    await sendCustomerWhatsApp(booking.phone, customerMessage);

    const adminMessage = adminBookingTemplate({
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      phone: booking.phone,
      roomTitle: booking.roomId?.title || "Room",
      roomType: booking.roomId?.roomType || "",
      checkIn: inDate.toLocaleDateString("en-IN"),
      checkOut: outDate.toLocaleDateString("en-IN"),
      adults: booking.adults,
      children: booking.children,
      total: booking.totalAmount,
    });

    await sendAdminWhatsApp(adminMessage);

  } catch (err) {
    console.log("WhatsApp Error:", err.message);
  }

  // ==========================
  // RETURN
  // ==========================

  return booking;

};
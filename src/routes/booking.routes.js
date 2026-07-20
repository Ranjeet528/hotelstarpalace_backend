import express from "express";

import {
  createBooking,
  checkAvailability,
  getAllBookings,
  getBookingById,
  cancelBooking,
  completeBooking,
  blockRoomDates,
  checkInBooking,
  checkOutBooking,
  getMyBookings,
trackGuestBooking,
cancelGuestBooking,
adminCancelBooking,
getBookingInvoice

} from "../controllers/booking.controller.js";
import { adminOnly, protect } from "../middleware/auth.middleware.js";





const router = express.Router();



// ==========================
// PUBLIC
// ==========================

router.post(
  "/check",
  checkAvailability
);




// ==========================
// USER BOOKINGS
// ==========================


// Create Booking
router.post(
  "/",
  protect,
  createBooking
);


// User My Bookings
router.get(
  "/my-bookings",
  protect,
  getMyBookings
);

// ============================================
// BOOKING INVOICE
// ============================================
router.get(
  "/:id/invoice",
  protect,
  getBookingInvoice
);


// Cancel Own Booking
router.put(
  "/cancel/:id",
  protect,
  cancelBooking
);




// ==========================
// ADMIN BOOKINGS
// ==========================


// All Bookings
router.get(
  "/",
  protect,
  adminOnly,
  getAllBookings
);



// Block Room Dates
router.post(
  "/block-room",
  protect,
  adminOnly,
  blockRoomDates
);



// Check In
router.patch(
  "/:id/checkin",
  protect,
  adminOnly,
  checkInBooking
);



// Check Out
router.patch(
  "/:id/checkout",
  protect,
  adminOnly,
  checkOutBooking
);



// Complete Booking
router.put(
  "/complete/:id",
  protect,
  adminOnly,
  completeBooking
);




// ==========================
// TEST
// ==========================

router.get(
  "/test-complete",
  (req,res)=>{
    res.send("Test OK");
  }
);





router.post("/track", trackGuestBooking);

router.put("/guest-cancel", cancelGuestBooking);

router.put(
  "/admin-cancel/:id",
  protect,
  adminOnly,
  adminCancelBooking
);

// ==========================
// SINGLE BOOKING
// ALWAYS LAST
// ==========================

router.get(
  "/:id",
  protect,
  getBookingById
);



export default router;
import express from "express";

import {
  createOrder,
  verifyPayment,

  getAllPayments,
  getPaymentById,

  getRefundRequests,
  approveRefund,
  rejectRefund,

  paymentDashboard,
} from "../controllers/payment.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ======================================
// USER ROUTES
// ======================================

router.post(
  "/create-order",
  protect,
  createOrder
);

router.post(
  "/verify",
  protect,
  verifyPayment
);

// ======================================
// ADMIN ROUTES
// ======================================

// Dashboard
router.get(
  "/dashboard",
  protect,
  adminOnly,
  paymentDashboard
);

// Refund Requests  ✅ BEFORE :id
router.get(
  "/refund-requests",
  protect,
  adminOnly,
  getRefundRequests
);

// All Payments
router.get(
  "/",
  protect,
  adminOnly,
  getAllPayments
);

// Single Payment ✅ AFTER refund-requests
router.get(
  "/:id",
  protect,
  adminOnly,
  getPaymentById
);

// Approve Refund
router.put(
  "/:id/approve-refund",
  protect,
  adminOnly,
  approveRefund
);

// Reject Refund
router.put(
  "/:id/reject-refund",
  protect,
  adminOnly,
  rejectRefund
);

export default router;
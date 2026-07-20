import express from "express";

import {
  register,
  login,
  logout,
  getMe,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,

  // ADMIN
  getAllUsers,
  getUserById,
  toggleUserBlock,
  updateUserRole,

} from "../controllers/auth.controller.js";

import {
  protect,
  adminOnly,
  superAdminOnly,
} from "../middleware/auth.middleware.js";


const router = express.Router();

// ==========================
// PUBLIC ROUTES
// ==========================

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Email Verification
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Logout
router.post(
  "/logout",
  protect,
  logout
);

// Forgot Password
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-otp", verifyForgotOTP);
router.post("/reset-password", resetPassword);

// ==========================
// USER ROUTES
// ==========================


// Current Logged In User
router.get("/me", protect, getMe);

// ==========================
// ADMIN ROUTES
// ==========================

// All Users
router.get(
  "/admin/users",
  protect,
  adminOnly,
  getAllUsers
);

// Single User
router.get(
  "/admin/users/:id",
  protect,
  adminOnly,
  getUserById
);

// Block / Unblock User
router.patch(
  "/admin/users/:id/block",
  protect,
  superAdminOnly,
  toggleUserBlock
);

// Change User Role
router.patch(
  "/admin/users/:id/role",
  protect,
  superAdminOnly,
  updateUserRole
);
export default router;
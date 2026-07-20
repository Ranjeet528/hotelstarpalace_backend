import express from "express";
import upload from "../middleware/upload.middleware.js";

import {
  getRooms,
  createRoom,
  getSingleRoom,
  updateRoom,
  deleteRoom,
  toggleRoomStatus,
  blockRoom,
  unblockRoom,
  toggleFeaturedRoom,
  getFeaturedRooms,
  searchRooms,
} from "../controllers/room.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

/* =====================================
   PUBLIC ROUTES
===================================== */

// All Rooms
router.get("/", getRooms);

// Featured Rooms
router.get("/featured", getFeaturedRooms);

// Search Rooms
router.get("/search", searchRooms);

// Single Room
router.get("/:id", getSingleRoom);

/* =====================================
   ADMIN ROUTES
===================================== */

// Create Room
router.post(
  "/",
  protect,
  adminOnly,
  upload.array("images", 10),
  createRoom
);

// Update Room
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.array("images", 10),
  updateRoom
);

// Delete Room
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteRoom
);

// Toggle Available / Unavailable
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  toggleRoomStatus
);

// Block Date Range
router.post(
  "/:id/block",
  protect,
  adminOnly,
  blockRoom
);

// Remove Block
router.post(
  "/:id/unblock",
  protect,
  adminOnly,
  unblockRoom
);

// Featured / Unfeatured
router.patch(
  "/:id/featured",
  protect,
  adminOnly,
  toggleFeaturedRoom
);

export default router;
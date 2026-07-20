import express from "express";

import {
  createContact,
  getAllContacts,
  getContact,
  markAsRead,
  deleteContact,
} from "../controllers/contact.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ==============================
// PUBLIC
// ==============================

// Contact Form Submit
router.post("/", createContact);

// ==============================
// ADMIN
// ==============================

// Get All Messages
router.get("/", protect, adminOnly, getAllContacts);

// Get Single Message
router.get("/:id", protect, adminOnly, getContact);

// Mark As Read
router.patch("/:id/read", protect, adminOnly, markAsRead);

// Delete Message
router.delete("/:id", protect, adminOnly, deleteContact);

export default router;
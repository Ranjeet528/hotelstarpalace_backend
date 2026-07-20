import express from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ===============================
// PUBLIC
// ===============================

// Website
router.get("/", getSettings);

// ===============================
// ADMIN
// ===============================

// Update Settings
router.put(
  "/",
  protect,
  adminOnly,
  updateSettings
);

export default router;
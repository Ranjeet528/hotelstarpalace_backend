import express from "express";

import {
  getChannelSettings,
  updateChannelSettings,
} from "../controllers/channelSetting.controller.js";
import { adminOnly, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// =============================
// GET CHANNEL SETTINGS
// =============================
router.get(
  "/",
  protect,
  adminOnly,
  getChannelSettings
);

// =============================
// UPDATE CHANNEL SETTINGS
// =============================
router.put(
  "/",
  protect,
  adminOnly,
  updateChannelSettings
);

export default router;
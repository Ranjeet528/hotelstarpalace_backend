import express from "express";
import {
  getAvailability,
  receiveOtaBooking,
  getRates,
} from "../controllers/channelManager.controller.js";
import { verifyChannelManagerAuth } from "../middleware/cmAuth.middleware.js";

const router = express.Router();

// In sab pe authentication zaroori hai — koi bhi random request nahi honi chahiye
router.get("/availability", verifyChannelManagerAuth, getAvailability);
router.get("/rates", verifyChannelManagerAuth, getRates);
router.post("/webhook/booking", verifyChannelManagerAuth, receiveOtaBooking);

export default router;
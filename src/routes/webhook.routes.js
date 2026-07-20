import express from "express";

import {
  razorpayWebhook,
} from "../controllers/webhook.controller.js";


const router = express.Router();


// ================================
// RAZORPAY WEBHOOK
// POST /api/webhook/razorpay
// ================================

router.post(
  "/razorpay",
  razorpayWebhook
);


export default router;
import express from "express";

import {
  getRatePlans,
  createRatePlan,
  updateRatePlan,
} from "../controllers/ratePlan.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getRatePlans);

router.post("/", protect, adminOnly, createRatePlan);

router.put("/:id", protect, adminOnly, updateRatePlan);

export default router;
import express from "express";

import {
  createReview,
  getRoomReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

// Public
router.post("/", createReview);

router.get("/room/:roomId", getRoomReviews);

// Admin
router.get("/admin", getAllReviews);

router.put("/approve/:id", approveReview);

router.put("/reject/:id", rejectReview);

router.delete("/:id", deleteReview);

export default router;
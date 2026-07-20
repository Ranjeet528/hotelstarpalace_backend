import express from "express";

import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
} from "../controllers/channel.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getChannels);

router.post("/", protect, adminOnly, createChannel);

router.put("/:id", protect, adminOnly, updateChannel);

router.delete("/:id", protect, adminOnly, deleteChannel);

export default router;
import express from "express";

import {
  getInventory,
  getRoomInventory,
} from "../controllers/inventory.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getInventory);

router.get(
  "/room/:roomId",
  protect,
  adminOnly,
  getRoomInventory
);

export default router;
import express from "express";

import {
  getSyncLogs,
} from "../controllers/syncLog.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getSyncLogs);

export default router;
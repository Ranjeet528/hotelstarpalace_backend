import express from "express";

import {
  getMappings,
  createMapping,
  updateMapping,
} from "../controllers/roomMapping.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getMappings);

router.post("/", protect, adminOnly, createMapping);

router.put("/:id", protect, adminOnly, updateMapping);

export default router;  
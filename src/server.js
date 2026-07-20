import "dotenv/config";
import express from "express";
import "./jobs/cron.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import roomRoutes from "./routes/room.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import reviewRouter from "./routes/review.routes.js";
import authRouter from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import ratePlanRoutes from "./routes/ratePlan.routes.js";
import roomMappingRoutes from "./routes/roomMapping.routes.js";
import syncLogRoutes from "./routes/syncLog.routes.js";
import channelSettingRoutes from "./routes/channelSetting.route.js";


const app = express();

app.use(
  "/api/webhook/razorpay",
  express.raw({
    type: "application/json",
  })
);
const allowedOrigins = [
  "http://localhost:3000",
  "https://hotelstarpalace-com.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Star Palace API Running 🚀");
});

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRouter);
app.use("/api/webhook", webhookRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRoutes);
app.use("/api/channels", channelRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/rate-plans", ratePlanRoutes);

app.use("/api/room-mappings", roomMappingRoutes);

app.use("/api/sync-logs", syncLogRoutes);
app.use(
  "/api/channel-settings",
  channelSettingRoutes
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

  app.listen(PORT, () => {
  console.log("\n================================");
  console.log(`🚀 Server Running On ${PORT}`);
  console.log("📦 MongoDB Connected (check logs)");
  console.log("================================\n");
});
  } catch (error) {
    console.error("❌ Server start failed:", error);
    process.exit(1);
  }
};

startServer();
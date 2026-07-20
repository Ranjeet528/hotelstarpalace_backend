import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    logo: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "website",
        "booking_com",
        "agoda",
        "mmt",
        "goibibo",
        "expedia",
        "airbnb",
        "other",
      ],
      required: true,
    },

    isConnected: {
      type: Boolean,
      default: false,
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    apiUrl: {
      type: String,
      default: "",
    },

    apiKey: {
      type: String,
      default: "",
    },

    apiSecret: {
      type: String,
      default: "",
    },

    hotelCode: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      default: "INR",
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    lastSyncAt: {
      type: Date,
    },

    syncStatus: {
      type: String,
      enum: [
        "idle",
        "syncing",
        "success",
        "failed",
      ],
      default: "idle",
    },

    lastError: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Channel",
  channelSchema
);
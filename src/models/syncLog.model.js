import mongoose from "mongoose";

const syncLogSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "inventory",
        "rate",
        "booking",
        "cancel",
        "modify",
      ],
      required: true,
    },

    action: {
      type: String,
      enum: [
        "push",
        "pull",
        "webhook",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "success",
        "failed",
      ],
      default: "pending",
    },

    request: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    error: {
      type: String,
      default: "",
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    syncedAt: Date,
  },
  {
    timestamps: true,
  }
);

syncLogSchema.index({
  channelId: 1,
  status: 1,
});

syncLogSchema.index({
  bookingId: 1,
});

syncLogSchema.index({
  roomId: 1,
});

export default mongoose.model(
  "SyncLog",
  syncLogSchema
);
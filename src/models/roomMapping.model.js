import mongoose from "mongoose";

const roomMappingSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },

    externalRoomId: {
      type: String,
      required: true,
      trim: true,
    },

    externalRoomName: {
      type: String,
      default: "",
      trim: true,
    },

    externalRatePlanId: {
      type: String,
      default: "",
      trim: true,
    },

    externalRatePlanName: {
      type: String,
      default: "",
      trim: true,
    },

    inventorySync: {
      type: Boolean,
      default: true,
    },

    rateSync: {
      type: Boolean,
      default: true,
    },

    bookingSync: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
      ],
      default: "active",
    },

    lastInventorySync: Date,

    lastRateSync: Date,

    lastBookingSync: Date,

    lastError: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Same room cannot be mapped twice
roomMappingSchema.index(
  {
    roomId: 1,
    channelId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "RoomMapping",
  roomMappingSchema
);
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    totalInventory: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },

    availableInventory: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },

    bookedInventory: {
      type: Number,
      default: 0,
      min: 0,
    },

    blockedInventory: {
      type: Number,
      default: 0,
      min: 0,
    },

    stopSell: {
      type: Boolean,
      default: false,
    },

    closedToArrival: {
      type: Boolean,
      default: false,
    },

    closedToDeparture: {
      type: Boolean,
      default: false,
    },

    minimumStay: {
      type: Number,
      default: 1,
      min: 1,
    },

    maximumStay: {
      type: Number,
      default: 365,
    },

    lastSyncAt: Date,

    syncStatus: {
      type: String,
      enum: [
        "pending",
        "syncing",
        "success",
        "failed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// One inventory record per room per day
inventorySchema.index(
  {
    roomId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "Inventory",
  inventorySchema
);
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    bookingEnabled: {
      type: Boolean,
      default: true,
    },

    checkInTime: {
      type: String,
      default: "12:00 PM",
    },

    checkOutTime: {
      type: String,
      default: "11:00 AM",
    },

    freeCancellationHours: {
      type: Number,
      default: 24,
    },

    gstPercentage: {
      type: Number,
      default: 12,
    },

    maxChildren: {
      type: Number,
      default: 2,
    },

    childAgeLimit: {
      type: Number,
      default: 5,
    },

    hotelNotice: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Setting",
  settingsSchema
);
import mongoose from "mongoose";

const ratePlanSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    extraAdultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraChildPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxIncluded: {
      type: Boolean,
      default: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    minimumStay: {
      type: Number,
      default: 1,
    },

    maximumStay: {
      type: Number,
      default: 365,
    },

    refundable: {
      type: Boolean,
      default: true,
    },

    breakfastIncluded: {
      type: Boolean,
      default: false,
    },

    weekendMultiplier: {
      type: Number,
      default: 1,
    },

    seasonalMultiplier: {
      type: Number,
      default: 1,
    },

    channelMultiplier: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
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

ratePlanSchema.index({
  roomId: 1,
  channelId: 1,
  code: 1,
});

export default mongoose.model(
  "RatePlan",
  ratePlanSchema
);
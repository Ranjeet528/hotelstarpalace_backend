import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    // Room Title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Price Per Night
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    // Description
    description: {
      type: String,
      default: "",
    },

    // Gallery Images (First image = Thumbnail)
    images: [
      {
        type: String,
        required: true,
      },
    ],

    // Room Type
    roomType: {
      type: String,
      enum: [
        "Standard",
        "Deluxe",
        "Super Deluxe",
        "Suite",
        "Executive",
        "Presidential",
      ],
      default: "Deluxe",
    },

    // Room Number (physical identifier — CM/OTA mapping is per physical room)
    roomNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Guests
    capacity: {
      type: Number,
      default: 2,
    },

    // Bed Type
    bed: {
      type: String,
      default: "King Bed",
    },

    // Room Size
    size: {
      type: String,
      default: "450 sq.ft",
    },

    // Floor
    floor: {
      type: Number,
      default: 1,
    },

    // Amenities
    amenities: [
      {
        type: String,
      },
    ],

    // Room Status
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },

    // Featured Room
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Date-wise Blocking
    blockedSlots: [
      {
        start: {
          type: Date,
          required: true,
        },

        end: {
          type: Date,
          required: true,
        },

        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
        },

        reason: {
          type: String,
          default: "",
        },
      },
    ],

    // ==========================
    // CHANNEL MANAGER / OTA SYNC
    // ==========================

    // Whether this room is exposed to the channel manager / OTAs at all.
    // Lets admin keep some rooms website-only (e.g. long-stay/local-only rooms).
    channelManagerEnabled: {
      type: Boolean,
      default: false,
    },

    // Per-OTA mapping — each platform assigns its own room/rate plan IDs,
    // so we keep a lookup table here instead of a single flat field.
    otaMappings: [
      {
        platform: {
          type: String,
          enum: ["booking_com", "agoda", "makemytrip", "goibibo", "expedia", "other"],
          required: true,
        },

        externalRoomId: {
          type: String,
          required: true,
          trim: true,
        },

        externalRatePlanId: {
          type: String,
          default: "",
          trim: true,
        },

        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Last time availability/rate was successfully pushed to the channel manager
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup when CM pushes a booking with an external room id
roomSchema.index({
  "otaMappings.platform": 1,
  "otaMappings.externalRoomId": 1,
});

export default mongoose.model("Room", roomSchema);
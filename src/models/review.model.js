import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Optional now (Open Reviews)
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },


    // Room Reference
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },


    // Guest Name
    customerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },


    // Email (Optional)
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },


    // Rating
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },


    // Review Title
    title: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 100,
    },


    // Review Message
    review: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },


    // Admin Approval System
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },


    // Verified Guest Badge
    // Since booking verification removed
    isVerified: {
      type: Boolean,
      default: false,
    },


    // Admin Reply
    adminReply: {
      type: String,
      default: "",
      trim: true,
    },


    // Helpful Reviews Count
    helpfulCount: {
      type: Number,
      default: 0,
    },


  },
  {
    timestamps:true,
  }
);


// Fast room review fetching
reviewSchema.index({
  roomId:1,
  status:1,
});


// Latest reviews first
reviewSchema.index({
  createdAt:-1,
});


export default mongoose.model(
  "Review",
  reviewSchema
);
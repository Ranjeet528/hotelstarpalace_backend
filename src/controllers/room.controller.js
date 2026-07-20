import Room from "../models/room.model.js";
import Booking from "../models/booking.model.js";

/* =========================
   GET ROOMS (FIXED + CLEAN)
========================= */
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    // FIX: previously this only checked if blockedSlots had any
    // entries at all, even past/expired ones. Now it checks whether
    // "now" actually falls inside one of the blocked date ranges.
    const now = new Date();

    const enrichedRooms = rooms.map((room) => ({
      ...room.toObject(),
      isCurrentlyBlocked: room.blockedSlots.some(
        (slot) => new Date(slot.start) <= now && new Date(slot.end) >= now
      ),
    }));

    res.json({
      success: true,
      rooms: enrichedRooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/* =========================
   CREATE ROOM
========================= */
export const createRoom = async (req, res) => {
  try {
    const images = req.files ? req.files.map((file) => file.path) : [];

    const room = await Room.create({
      ...req.body,
      images,
    });

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET SINGLE ROOM
========================= */
export const getSingleRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE ROOM
========================= */
export const updateRoom = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => file.path);
    }

    const room = await Room.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE ROOM
========================= */
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   STATUS TOGGLE (ONLY AVAILABLE / UNAVAILABLE)
========================= */
export const toggleRoomStatus = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.status = room.status === "available" ? "unavailable" : "available";

    await room.save();

    res.json({
      success: true,
      message: "Room status updated",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   BLOCK ROOM (DATE RANGE)
========================= */
export const blockRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end, reason } = req.body;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const newStart = new Date(start);
    const newEnd = new Date(end);

    // overlap check
    const isOverlapping = room.blockedSlots.some((slot) => {
      return newStart < new Date(slot.end) && newEnd > new Date(slot.start);
    });

    if (isOverlapping) {
      return res.status(400).json({
        success: false,
        message: "Date range already blocked",
      });
    }

    room.blockedSlots.push({
      start: newStart,
      end: newEnd,
      reason: reason || "",
    });

    await room.save();

    res.json({
      success: true,
      message: "Room blocked successfully",
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const unblockRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // remove ALL blocks
    room.blockedSlots = [];

    await room.save();

    res.json({
      success: true,
      message: "Room unblocked successfully",
      room,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleFeaturedRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.isFeatured = !room.isFeatured;
    await room.save();

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFeaturedRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      isFeatured: true,
      status: "available",
    })
      .limit(3)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchRooms = async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      adults = 1,
      children = 0,
      roomType = "all",
    } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and Check-out dates are required.",
      });
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after Check-in date.",
      });
    }

    const requiredAdults = Number(adults);

    // Base filter
    const filter = {
      status: "available",
    };

    // Room type filter
    if (roomType && roomType !== "all") {
      filter.roomType = roomType;
    }

    let rooms = await Room.find(filter);

    // Get all active bookings in selected date range.
    // FIX: was only checking status "booked" — a room occupied by a
    // currently checked-in guest would incorrectly show as available.
    const bookings = await Booking.find({
      status: { $in: ["booked", "checked_in"] },
      checkIn: { $lt: endDate },
      checkOut: { $gt: startDate },
    }).select("roomId");

    const bookedRoomIds = bookings.map((b) => b.roomId.toString());

    rooms = rooms.filter((room) => {
      // Already booked
      if (bookedRoomIds.includes(room._id.toString())) {
        return false;
      }

      // Capacity
      if (room.capacity < requiredAdults) {
        return false;
      }

      // Blocked Slots
      const blocked = room.blockedSlots?.some((slot) => {
        return startDate < new Date(slot.end) && endDate > new Date(slot.start);
      });

      if (blocked) {
        return false;
      }

      return true;
    });

    return res.status(200).json({
      success: true,
      total: rooms.length,
      rooms,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
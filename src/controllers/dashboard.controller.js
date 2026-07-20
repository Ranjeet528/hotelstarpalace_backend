import Room from "../models/room.model.js";
import Booking from "../models/booking.model.js";

/* =========================
   GET DASHBOARD STATS
========================= */
export const getDashboardStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();

    // Rooms an admin has manually marked out-of-service (maintenance etc).
    // NOTE: Room.status only reflects this manual toggle — it is never
    // set automatically when a booking is created, so it does NOT tell
    // us which rooms currently have a guest in them.
    const maintenanceRooms = await Room.countDocuments({
      status: "unavailable",
    });

    // "Booked" here means: a guest is physically checked in right now.
    // We count distinct rooms with an active checked_in booking rather
    // than relying on Room.status, since that field is never updated
    // automatically by the booking flow.
    const occupiedRoomIds = await Booking.distinct("roomId", {
      status: "checked_in",
    });
    const bookedRooms = occupiedRoomIds.length;

    const availableRooms = Math.max(
      totalRooms - bookedRooms - maintenanceRooms,
      0
    );

    // ✅ REVENUE — only bookings that have actually completed a stay.
    // (checkOutBooking sets status to "completed"; "checked_out" is kept
    // in the schema for compatibility but isn't currently set by any
    // controller, so we match both to be safe.)
    const REVENUE_STATUSES = ["completed", "checked_out"];

    const revenueAgg = await Booking.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const revenue = revenueAgg[0]?.total || 0;

    // ✅ REVENUE TREND — daily revenue, based on checkout date
    const revenueTrendRaw = await Booking.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$checkOut" },
          },
          revenue: { $sum: "$price" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueTrend = revenueTrendRaw.map((point) => ({
      label: point._id,
      revenue: point.revenue,
    }));

    // extra useful stats
    const totalBookings = await Booking.countDocuments();
    const cancelledBookings = await Booking.countDocuments({
      status: "cancelled",
    });
    const completedBookings = await Booking.countDocuments({
      status: { $in: REVENUE_STATUSES },
    });

    // =========================
    // TODAY SNAPSHOT
    // =========================
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const todayNewBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
    });

    const todayCheckIns = await Booking.countDocuments({
      checkIn: { $gte: startOfToday, $lt: startOfTomorrow },
      status: { $in: ["booked", "checked_in"] },
    });

    const todayCheckOuts = await Booking.countDocuments({
      checkOut: { $gte: startOfToday, $lt: startOfTomorrow },
      status: { $in: REVENUE_STATUSES },
    });

    const todayRevenueAgg = await Booking.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          checkedOutAt: { $gte: startOfToday, $lt: startOfTomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    // =========================
    // WEEK-OVER-WEEK COMPARISON
    // =========================
    // "This week" = last 7 days including today. "Last week" = the
    // 7 days before that. Compared by checkout date (when revenue
    // actually lands) and by createdAt (when the booking was made).
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 6);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const getWeekTotals = async (start, end) => {
      const revenueRes = await Booking.aggregate([
        {
          $match: {
            status: { $in: REVENUE_STATUSES },
            checkedOutAt: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]);

      const bookings = await Booking.countDocuments({
        createdAt: { $gte: start, $lt: end },
      });

      return {
        revenue: revenueRes[0]?.total || 0,
        bookings,
      };
    };

    const thisWeek = await getWeekTotals(startOfThisWeek, startOfTomorrow);
    const lastWeek = await getWeekTotals(startOfLastWeek, startOfThisWeek);

    const percentChange =
      lastWeek.revenue > 0
        ? Math.round(
            ((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100
          )
        : thisWeek.revenue > 0
        ? 100
        : 0;

    // =========================
    // TOP PERFORMING ROOMS
    // =========================
    const topRoomsRaw = await Booking.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: "$roomId",
          revenue: { $sum: "$price" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          roomId: "$_id",
          title: { $ifNull: ["$room.title", "Deleted Room"] },
          roomType: "$room.roomType",
          revenue: 1,
          bookings: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        bookedRooms,
        maintenanceRooms,
        revenue,
        revenueTrend,

        // extra useful stats
        totalBookings,
        cancelledBookings,
        completedBookings,

        // today snapshot
        today: {
          newBookings: todayNewBookings,
          checkIns: todayCheckIns,
          checkOuts: todayCheckOuts,
          revenue: todayRevenue,
        },

        // week-over-week comparison
        weeklyComparison: {
          thisWeek,
          lastWeek,
          percentChange,
        },

        // top performing rooms by revenue
        topRooms: topRoomsRaw,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   ROOM DISTRIBUTION (standalone, if needed elsewhere)
========================= */
export const getRoomDistribution = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();

    const maintenanceRooms = await Room.countDocuments({
      status: "unavailable",
    });

    const occupiedRoomIds = await Booking.distinct("roomId", {
      status: "checked_in",
    });
    const bookedRooms = occupiedRoomIds.length;

    const availableRooms = Math.max(
      totalRooms - bookedRooms - maintenanceRooms,
      0
    );

    res.json({
      success: true,
      data: [
        { name: "Available", value: availableRooms },
        { name: "Booked", value: bookedRooms },
        { name: "Blocked", value: maintenanceRooms },
      ],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ==========================
// UPCOMING CHECK INS
// ==========================


export const getRecentPayments = async (req, res) => {
  try {

    const payments =
      await Booking.find({
        paymentStatus: "paid",
      })
        .populate(
          "roomId",
          "title roomType"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5);

    return res.status(200).json({
      success: true,
      data: payments,
    });

  } catch (error) {

    console.log(
      "Recent Payments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const getBookingSources = async (req, res) => {
  try {

    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$bookingSource",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    console.log(
      "Booking Source Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const getPaymentStatusSummary = async (req, res) => {
  try {

    const data = await Booking.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: {
            $sum: 1,
          },
          amount: {
            $sum: "$totalAmount",
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {

    console.log(
      "Payment Summary Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ==========================
// TOP CUSTOMERS
// ==========================
export const getTopCustomers = async (req, res) => {
  try {

    const customers = await Booking.aggregate([

      {
        $group: {
          _id: "$userId",

          customerName: {
            $first: "$customerName",
          },

          phone: {
            $first: "$phone",
          },

          email: {
            $first: "$email",
          },

          totalBookings: {
            $sum: 1,
          },

          totalSpent: {
            $sum: "$totalAmount",
          },

        },
      },

      {
        $sort: {
          totalSpent: -1,
        },
      },

      {
        $limit: 10,
      },

    ]);

    return res.status(200).json({
      success: true,
      data: customers,
    });

  } catch (error) {

    console.log(
      "Top Customers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ==========================
// MONTHLY REVENUE (LAST 12 MONTHS)
// ==========================

export const getMonthlyRevenue = async (req, res) => {
  try {

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMonth(startDate.getMonth() - 11);

    const data = await Booking.aggregate([
      {
        $match: {
          status: {
            $in: [
              "completed",
              "checked_out",
            ],
          },
          checkedOutAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$checkedOutAt",
            },
            month: {
              $month: "$checkedOutAt",
            },
          },

          revenue: {
            $sum: "$totalAmount",
          },

          bookings: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 11; i >= 0; i--) {

      const date = new Date();

      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const found = data.find(
        item =>
          item._id.year === year &&
          item._id.month === month
      );

      months.push({
        label: `${monthNames[month - 1]} ${String(year).slice(-2)}`,
        revenue: found?.revenue || 0,
        bookings: found?.bookings || 0,
      });

    }

    return res.status(200).json({
      success: true,
      data: months,
    });

  } catch (error) {

    console.log(
      "Monthly Revenue Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ==========================
// OCCUPANCY REPORT
// ==========================

export const getOccupancyReport = async (req, res) => {
  try {

    const totalRooms =
      await Room.countDocuments({
        status: {
          $ne: "unavailable",
        },
      });

    const occupiedRooms =
      await Booking.distinct(
        "roomId",
        {
          status: "checked_in",
        }
      );

    const occupied =
      occupiedRooms.length;

    const available =
      Math.max(
        totalRooms - occupied,
        0
      );

    const occupancyRate =
      totalRooms > 0
        ? Number(
            (
              (occupied / totalRooms) *
              100
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalRooms,
        occupiedRooms: occupied,
        availableRooms: available,
        occupancyRate,
      },
    });

  } catch (error) {

    console.log(
      "Occupancy Report Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==========================
// TODAY ACTIVITIES
// ==========================

export const getTodayActivities = async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      newBookings,
      checkIns,
      checkOuts,
      cancellations,
    ] = await Promise.all([

      Booking.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      }),

      Booking.countDocuments({
        checkIn: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $in: [
            "booked",
            "checked_in",
          ],
        },
      }),

      Booking.countDocuments({
        checkedOutAt: {
          $gte: today,
          $lt: tomorrow,
        },
        status: {
          $in: [
            "completed",
            "checked_out",
          ],
        },
      }),

      Booking.countDocuments({
        cancelledAt: {
          $gte: today,
          $lt: tomorrow,
        },
        status: "cancelled",
      }),

    ]);

    return res.status(200).json({
      success: true,
      data: {
        newBookings,
        checkIns,
        checkOuts,
        cancellations,
      },
    });

  } catch (error) {

    console.log(
      "Today Activities Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


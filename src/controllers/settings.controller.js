import Setting from "../models/settings.model.js";

// ===================================
// GET SETTINGS
// GET /api/settings
// ===================================
export const getSettings = async (req, res) => {
  try {

    let settings = await Setting.findOne();

    // First time project run hone par
    if (!settings) {
      settings = await Setting.create({});
    }

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {

    console.log("Get Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===================================
// UPDATE SETTINGS
// PUT /api/settings
// ===================================
export const updateSettings = async (req, res) => {
  try {

    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({});
    }

    const {
      bookingEnabled,
      checkInTime,
      checkOutTime,
      freeCancellationHours,
      gstPercentage,
      maxChildren,
      childAgeLimit,
      hotelNotice,
    } = req.body;

    settings.bookingEnabled =
      bookingEnabled ?? settings.bookingEnabled;

    settings.checkInTime =
      checkInTime || settings.checkInTime;

    settings.checkOutTime =
      checkOutTime || settings.checkOutTime;

    settings.freeCancellationHours =
      freeCancellationHours ??
      settings.freeCancellationHours;

    settings.gstPercentage =
      gstPercentage ??
      settings.gstPercentage;

    settings.maxChildren =
      maxChildren ??
      settings.maxChildren;

    settings.childAgeLimit =
      childAgeLimit ??
      settings.childAgeLimit;

    settings.hotelNotice =
      hotelNotice ?? settings.hotelNotice;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });

  } catch (error) {

    console.log("Update Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
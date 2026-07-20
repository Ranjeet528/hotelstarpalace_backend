import ChannelSetting from "../models/channelSetting.model.js";

// ======================================
// GET SETTINGS
// ======================================

export const getChannelSettings = async (
  req,
  res
) => {

  try {

    let settings =
      await ChannelSetting.findOne();

    if (!settings) {

      settings =
        await ChannelSetting.create({});

    }

    return res.status(200).json({

      success: true,

      data: settings,

    });

  } catch (error) {

    console.log(
      "Get Channel Settings Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

// ======================================
// UPDATE SETTINGS
// ======================================

export const updateChannelSettings = async (
  req,
  res
) => {

  try {

    let settings =
      await ChannelSetting.findOne();

    if (!settings) {

      settings =
        await ChannelSetting.create({});

    }

    Object.assign(
      settings,
      req.body
    );

    await settings.save();

    return res.status(200).json({

      success: true,

      message:
        "Channel Settings Updated Successfully",

      data: settings,

    });

  } catch (error) {

    console.log(
      "Update Channel Settings Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
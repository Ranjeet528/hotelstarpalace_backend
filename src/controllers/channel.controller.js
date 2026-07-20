import Channel from "../models/channel.model.js";

// ======================
// GET ALL CHANNELS
// ======================
export const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: channels,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// CREATE CHANNEL
// ======================
export const createChannel = async (req, res) => {
  try {
    const channel = await Channel.create(req.body);

    res.status(201).json({
      success: true,
      data: channel,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// UPDATE CHANNEL
// ======================
export const updateChannel = async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: channel,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// DELETE CHANNEL
// ======================
export const deleteChannel = async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Channel deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
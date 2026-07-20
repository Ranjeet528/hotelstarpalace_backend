import RoomMapping from "../models/roomMapping.model.js";

export const getMappings = async (req, res) => {
  try {
    const mappings = await RoomMapping.find()
      .populate("roomId");

    res.json({
      success: true,
      data: mappings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createMapping = async (req, res) => {
  try {
    const mapping = await RoomMapping.create(req.body);

    res.status(201).json({
      success: true,
      data: mapping,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateMapping = async (req, res) => {
  try {
    const mapping = await RoomMapping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: mapping,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
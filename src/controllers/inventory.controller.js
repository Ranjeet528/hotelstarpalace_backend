import Inventory from "../models/inventory.model.js";

export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("roomId")
      .sort({ date: 1 });

    res.json({
      success: true,
      data: inventory,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getRoomInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({
      roomId: req.params.roomId,
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: inventory,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
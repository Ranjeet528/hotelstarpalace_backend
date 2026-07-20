import RatePlan from "../models/ratePlan.model.js";

export const getRatePlans = async (req, res) => {
  try {
    const plans = await RatePlan.find()
      .populate("roomId");

    res.json({
      success: true,
      data: plans,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createRatePlan = async (req, res) => {
  try {
    const plan = await RatePlan.create(req.body);

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateRatePlan = async (req, res) => {
  try {
    const plan = await RatePlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
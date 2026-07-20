import SyncLog from "../models/syncLog.model.js";

export const getSyncLogs = async (req, res) => {
  try {
    const logs = await SyncLog.find()
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
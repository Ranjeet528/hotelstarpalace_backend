// middleware/cmAuth.middleware.js
export const verifyChannelManagerAuth = (req, res, next) => {
  const apiKey = req.headers["x-cm-api-key"];

  if (apiKey !== process.env.CHANNEL_MANAGER_API_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  next();
};
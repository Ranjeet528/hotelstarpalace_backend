import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// ==========================
// PROTECT ROUTE
// ==========================
export const protect = async (req, res, next) => {
  try {
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   const user = await User.findById(decoded.id)
  .select("_id name email role isBlocked isVerified avatar")
  .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Protect Middleware Error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================
// ADMIN ONLY
// ==========================
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};

// ==========================
// SUPER ADMIN ONLY
// ==========================
export const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Super Admin access only",
    });
  }

  next();
};
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";
import Booking from "../models/booking.model.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendEmail } from "../utils/sendEmail.js";

export const register = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success:false,
        message:"All fields are required",
      });
    }

    if(password.length < 8){
      return res.status(400).json({
        success:false,
        message:"Password must be at least 8 characters",
      });
    }

    const emailExist = await User.findOne({
      email:email.toLowerCase().trim(),
    });

    if(emailExist){
      return res.status(409).json({
        success:false,
        message:"Email already registered",
      });
    }

    const phoneExist = await User.findOne({
      phone:phone.trim(),
    });

    if(phoneExist){
      return res.status(409).json({
        success:false,
        message:"Phone already registered",
      });
    }

    const otp = generateOTP();

    const otpExpire = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user = await User.create({

      name:name.trim(),

      email:email.toLowerCase().trim(),

      phone:phone.trim(),

      password,

      otp,

      otpExpire,

      isVerified:false,

    });

    await sendEmail({

      to:user.email,

      subject:"Star Palace Email Verification",

      html:`
      <div style="font-family:Arial;padding:30px">

        <h2>Welcome to Star Palace</h2>

        <p>Your verification code is</p>

        <h1 style="letter-spacing:5px">
          ${otp}
        </h1>

        <p>
          OTP expires in 10 minutes.
        </p>

      </div>
      `

    });

    return res.status(201).json({

      success:true,

      message:"Registration successful. OTP sent to your email.",

      email:user.email,

    });

  }

  catch(error){

    console.log("Register Error:",error);

    return res.status(500).json({

      success:false,

      message:error.message,

    });

  }

};
export const login = async (req, res) => {
  try {

    const {
      email,
      password,
    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ==========================
    // FIND USER
    // ==========================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ==========================
    // BLOCKED USER
    // ==========================

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    if(!user.isVerified){

    return res.status(403).json({

        success:false,

        message:"Please verify your email first."

    });

}

    // ==========================
    // PASSWORD CHECK
    // ==========================

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
   

    // ==========================
    // UPDATE LAST LOGIN
    // ==========================

    user.lastLogin = new Date();

    await user.save();

    // ==========================
    // GENERATE JWT COOKIE
    // ==========================

    generateToken(res, user);

    return res.status(200).json({

      success: true,

      message: "Login successful",

      user: {

        _id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        role: user.role,

        avatar: user.avatar,

      },

    });

  } catch (error) {

    console.log("Login Error:", error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }
};
export const logout = async (req, res) => {
  try {

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });

  } catch (error) {

    console.log("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const getMe = async (req, res) => {
  try {

    return res.status(200).json({

      success: true,

      user: req.user,

    });

  } catch (error) {

    console.log("Get Me Error:", error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ==========================
    // VALIDATION
    // ==========================
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // ==========================
    // FIND USER
    // ==========================
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // ALREADY VERIFIED
    // ==========================
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // ==========================
    // OTP EXISTS
    // ==========================
    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // ==========================
    // ATTEMPT LIMIT
    // ==========================
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // ==========================
    // OTP EXPIRED
    // ==========================
    if (new Date() > user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // ==========================
    // WRONG OTP
    // ==========================
    if (user.otp !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ==========================
    // SUCCESS
    // ==========================
    user.isVerified = true;
    user.otp = "";
    user.otpExpire = null;
    user.otpAttempts = 0;

    await user.save();

    // Auto Login
    generateToken(res, user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const resendOTP = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {

      return res.status(400).json({

        success: false,

        message: "Email is required",

      });

    }

    const user = await User.findOne({

      email: email.toLowerCase().trim(),

    });

    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }

    if (user.isVerified) {

      return res.status(400).json({

        success: false,

        message: "Email already verified",

      });

    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpire = new Date(

      Date.now() + 10 * 60 * 1000

    );

    user.otpAttempts = 0;

    await user.save();

    await sendEmail({

      to: user.email,

      subject: "Star Palace OTP Verification",

      html: `
        <div style="font-family:Arial;padding:30px">

          <h2>Star Palace</h2>

          <p>Your new OTP is</p>

          <h1 style="letter-spacing:5px">

            ${otp}

          </h1>

          <p>

            OTP expires in 10 minutes.

          </p>

        </div>
      `,

    });

    return res.status(200).json({

      success: true,

      message: "OTP sent successfully",

    });

  } catch (error) {

    console.log("Resend OTP Error:", error);

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
export const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (!email) {

      return res.status(400).json({

        success: false,

        message: "Email is required",

      });

    }

    // ==========================
    // FIND USER
    // ==========================

    const user = await User.findOne({

      email: email.toLowerCase().trim(),

    });

    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found",

      });

    }

    // ==========================
    // GENERATE OTP
    // ==========================

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpire = new Date(

      Date.now() + 10 * 60 * 1000

    );

    user.otpAttempts = 0;

    await user.save();

    // ==========================
    // SEND EMAIL
    // ==========================

    await sendEmail({

      to: user.email,

      subject: "Star Palace - Reset Password OTP",

      html: `

      <div style="font-family:Arial;padding:30px">

          <h2>Password Reset</h2>

          <p>Your OTP is</p>

          <h1>${otp}</h1>

          <p>

          This OTP will expire in

          <b>10 minutes</b>.

          </p>

      </div>

      `,

    });

    return res.status(200).json({

      success: true,

      message: "OTP sent successfully",

    });

  }

  catch (error) {

    console.log(

      "Forgot Password Error:",

      error

    );

    return res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
export const verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ==========================
    // VALIDATION
    // ==========================
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // ==========================
    // FIND USER
    // ==========================
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // OTP EXISTS
    // ==========================
    if (!user.otp || !user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // ==========================
    // TOO MANY ATTEMPTS
    // ==========================
    if (user.otpAttempts >= 5) {
      user.otp = "";
      user.otpExpire = null;
      await user.save();

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // ==========================
    // OTP EXPIRED
    // ==========================
    if (user.otpExpire < new Date()) {
      user.otp = "";
      user.otpExpire = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // ==========================
    // INVALID OTP
    // ==========================
    if (user.otp !== otp.trim()) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ==========================
    // SUCCESS
    // ==========================
    user.otp = "";
    user.otpExpire = null;
    user.otpAttempts = 0;
    user.resetPasswordVerified = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.log("Verify Forgot OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const resetPassword = async (req, res) => {

  try {

    const {
      email,
      password,
      confirmPassword,
    } = req.body;



    // ==========================
    // VALIDATION
    // ==========================

    if (!email || !password || !confirmPassword) {

      return res.status(400).json({

        success:false,

        message:"All fields are required",

      });

    }



    if (password.length < 8) {

      return res.status(400).json({

        success:false,

        message:"Password must be at least 8 characters",

      });

    }



    if (password !== confirmPassword) {

      return res.status(400).json({

        success:false,

        message:"Passwords do not match",

      });

    }




    // ==========================
    // FIND USER
    // ==========================

    const user = await User.findOne({

      email: email.toLowerCase().trim(),

    }).select("+password");



    if (!user) {

      return res.status(404).json({

        success:false,

        message:"User not found",

      });

    }




    // ==========================
    // CHECK OTP VERIFICATION
    // ==========================

    if (!user.resetPasswordVerified) {

      return res.status(403).json({

        success:false,

        message:"Please verify OTP first",

      });

    }




    // ==========================
    // UPDATE PASSWORD
    // ==========================

    user.password = password;



    user.resetPasswordVerified = false;

    user.otp = "";

    user.otpExpire = null;

    user.otpAttempts = 0;



    await user.save();




    return res.status(200).json({

      success:true,

      message:"Password reset successfully",

    });



  }

  catch(error){


    console.log(

      "Reset Password Error:",

      error

    );


    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }

};
export const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const skip = (page - 1) * limit;

    // ==========================
    // SEARCH FILTER
    // ==========================
    let filter = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ==========================
    // TOTAL USERS
    // ==========================
    const totalUsers = await User.countDocuments(filter);

    // ==========================
    // USERS
    // ==========================
    const users = await User.find(filter)
      .select(
        "-password -otp -otpExpire -otpAttempts -resetPasswordVerified"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,

      totalUsers,

      currentPage: page,

      totalPages: Math.ceil(totalUsers / limit),

      users,
    });

  } catch (error) {
    console.log("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getUserById = async (req, res) => {
  try {

    const { id } = req.params;

    // ==========================
    // VALID OBJECT ID
    // ==========================
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    // ==========================
    // FIND USER
    // ==========================
    const user = await User.findById(id)
      .select(
        "-password -otp -otpExpire -otpAttempts -resetPasswordVerified"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // USER BOOKINGS
    // ==========================
    const bookings = await Booking.find({
      userId: user._id,
    })
      .populate(
        "roomId",
        "title roomType price images"
      )
      .sort({
        createdAt: -1,
      });

    // ==========================
    // STATS
    // ==========================
    const totalBookings = bookings.length;

    const completedBookings = bookings.filter(
      (b) => b.status === "completed"
    ).length;

    const cancelledBookings = bookings.filter(
      (b) => b.status === "cancelled"
    ).length;

    const activeBookings = bookings.filter((b) =>
      ["booked", "checked_in"].includes(b.status)
    ).length;

    const totalSpent = bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce(
        (sum, booking) => sum + (booking.totalAmount || 0),
        0
      );

    const totalNights = bookings.reduce(
      (sum, booking) => sum + (booking.nights || 0),
      0
    );

    // ==========================
    // RESPONSE
    // ==========================
    return res.status(200).json({
      success: true,

      user,

      bookings,

      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalSpent,
        totalNights,
      },
    });

  } catch (error) {

    console.log("Get User By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const toggleUserBlock = async (req, res) => {
  try {
    const userId = req.params.id;

    // ==========================
    // FIND TARGET USER
    // ==========================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // SELF BLOCK NOT ALLOWED
    // ==========================
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block your own account",
      });
    }

    // ==========================
    // ONLY SUPERADMIN CAN BLOCK ADMIN
    // ==========================
    if (
      user.role === "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can block an Admin",
      });
    }

    // ==========================
    // SUPERADMIN CANNOT BE BLOCKED
    // ==========================
    if (user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin cannot be blocked",
      });
    }

    // ==========================
    // TOGGLE STATUS
    // ==========================
    user.isBlocked = !user.isBlocked;

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });

  } catch (error) {
    console.log("Toggle User Block Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // ==========================
    // VALIDATION
    // ==========================
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // ==========================
    // FIND USER
    // ==========================
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================
    // SELF ROLE CHANGE NOT ALLOWED
    // ==========================
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // ==========================
    // ADMIN RESTRICTIONS
    // ==========================
    if (req.user.role === "admin") {
      // Admin cannot modify another admin/superadmin
      if (user.role !== "user") {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to change this user's role",
        });
      }

      // Admin cannot create another admin/superadmin
      if (role !== "user") {
        return res.status(403).json({
          success: false,
          message: "Only Super Admin can assign Admin or Super Admin roles",
        });
      }
    }

    // ==========================
    // SUPERADMIN RESTRICTIONS
    // ==========================
    if (
      req.user.role === "superadmin" &&
      user.role === "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Super Admin role cannot be changed",
      });
    }

    // ==========================
    // UPDATE ROLE
    // ==========================
    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.log("Update User Role Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
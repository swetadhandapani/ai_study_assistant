const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const sgMail = require("@sendgrid/mail");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const formatUser = require("../utils/formatUser");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * SEND EMAIL USING SENDGRID
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_VERIFIED_EMAIL,
      subject,
      html,
    });
  } catch (error) {
    console.error("SendGrid error:", error);
    throw new Error("Email sending failed");
  }
};

/**
 * Common validation error handler
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({ field: err.path, msg: err.msg })),
    });
  }
  return false;
};

/**
 * REGISTER → creates user + sends verification email
 */
exports.registerValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

exports.register = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const verificationToken = crypto.randomBytes(20).toString("hex");

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationToken: crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex"),
      verificationExpires: Date.now() + 3600000, // 1 hour
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email",
      html: `
        <p>Hi ${user.name},</p>
        <p>Welcome! Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * LOGIN → only verified users allowed + 2FA
 */
exports.loginValidators = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.login = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email first." });

    // 2FA flow
    if (user.is2FAEnabled) {
      if (user.twoFactorMethod === "email") {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.temp2FACode = crypto
          .createHash("sha256")
          .update(otp)
          .digest("hex");
        user.temp2FAExpires = Date.now() + 5 * 60 * 1000; // 5 mins
        await user.save();

        await sendEmail({
          to: user.email,
          subject: "Your 2FA Code",
          html: `<p>Your login code is <b>${otp}</b>. It expires in 5 minutes.</p>`,
        });

        return res.json({
          message: "2FA code sent to your email",
          requires2FA: true,
          method: "email",
        });
      } else if (user.twoFactorMethod === "totp") {
        return res.json({
          message: "Enter your Authenticator App code",
          requires2FA: true,
          method: "totp",
        });
      }
    }

    // No 2FA
    res.json({
      message: "✅ Logged in successfully",
      user: formatUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * FORGOT PASSWORD
 */
exports.forgotPasswordValidators = [
  body("email").isEmail().withMessage("Valid email required"),
];

exports.forgotPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Hi ${user.name},</p>
             <p>Click to reset password:</p>
             <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
             <p>If you did not request this, ignore this email.</p>`,
    });

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * RESET PASSWORD
 */
exports.resetPasswordValidators = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

exports.resetPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * VERIFY EMAIL
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Verification token missing" });
    }

    // Hash the incoming token (same way it was stored in DB)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find matching user
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      const existingUser = await User.findOne({
        verificationToken: hashedToken,
      });
      if (existingUser?.isVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }
      return res.status(400).json({
        message:
          "Invalid or expired token. Please request a new verification email.",
      });
    }

    // ✅ Mark verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // ✅ Generate JWT immediately
    const jwtToken = generateToken(user._id);

    return res.json({
      success: true,
      message: "✅ Email verified successfully! You are now logged in.",
      user: formatUser(user),
      token: jwtToken,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * RESEND VERIFICATION EMAIL
 */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ message: "User is already verified" });

    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationExpires = Date.now() + 3600000;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Resend Email Verification",
      html: `
        <p>Hi ${user.name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * VERIFY 2FA EMAIL
 */
exports.verify2FA = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.temp2FACode)
      return res.status(400).json({ message: "2FA not initiated" });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const wait = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        message: `⛔ Account temporarily locked. Try again in ${wait} minutes.`,
      });
    }

    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    if (user.temp2FACode !== hashedCode || user.temp2FAExpires < Date.now()) {
      user.failed2FAAttempts = (user.failed2FAAttempts || 0) + 1;

      if (user.failed2FAAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        await user.save();
        return res.status(423).json({
          message:
            "⛔ Too many failed attempts. Account locked for 15 minutes.",
        });
      }

      await user.save();
      return res
        .status(400)
        .json({ message: "❌ Invalid or expired code. Try again." });
    }

    user.failed2FAAttempts = 0;
    user.lockUntil = undefined;
    user.temp2FACode = undefined;
    user.temp2FAExpires = undefined;
    user.is2FAEnabled = true;
    user.twoFactorMethod = "email";
    await user.save();

    res.json({
      message: "✅ 2FA verified successfully",
      user: formatUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * RESEND 2FA EMAIL
 */
exports.resend2FA = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.is2FAEnabled)
      return res.status(400).json({ message: "2FA not enabled for this user" });

    if (user.lockUntil && user.lockUntil > Date.now())
      return res
        .status(423)
        .json({ message: "⛔ Account locked. Cannot resend code right now." });

    if (user.last2FAResend && Date.now() - user.last2FAResend < 30 * 1000)
      return res
        .status(429)
        .json({ message: "⏳ Please wait 30s before requesting again" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.temp2FACode = crypto.createHash("sha256").update(otp).digest("hex");
    user.temp2FAExpires = Date.now() + 5 * 60 * 1000;
    user.last2FAResend = Date.now();
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Your 2FA Code (Resent)",
      html: `<p>Your login code is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });

    res.json({ message: "✅ A new 2FA code has been sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * TOGGLE 2FA (enable/disable)
 */
exports.toggle2FA = async (req, res) => {
  try {
    const { enable, method } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (enable) {
      if (method === "email") {
        user.is2FAEnabled = true;
        user.twoFactorMethod = "email";
        user.twoFactorSecret = undefined;
      } else if (method === "totp") {
        return res
          .status(400)
          .json({ message: "Use /enable-totp endpoint for TOTP setup" });
      } else {
        return res.status(400).json({ message: "Invalid 2FA method" });
      }
    } else {
      user.is2FAEnabled = false;
      user.twoFactorMethod = null;
      user.twoFactorSecret = undefined;
    }

    await user.save();
    res.json({
      message: `2FA ${enable ? "enabled" : "disabled"} via ${
        user.twoFactorMethod || "none"
      }`,
      user: formatUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to toggle 2FA", error: err.message });
  }
};

/**
 * ENABLE TOTP
 */
exports.enableTOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({ name: "AI Study Assistant" });
    user.twoFactorSecret = secret.base32;
    user.twoFactorMethod = "totp";
    user.is2FAEnabled = true;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: "TOTP enabled. Scan this QR code with Google Authenticator.",
      qrCodeUrl,
      secret: secret.base32,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to enable TOTP", error: err.message });
  }
};

/**
 * VERIFY TOTP
 */
exports.verifyTOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.twoFactorSecret)
      return res.status(400).json({ message: "TOTP not set up" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.toString().trim(),
      window: 2,
    });

    if (!verified) {
      user.failed2FAAttempts = (user.failed2FAAttempts || 0) + 1;
      if (user.failed2FAAttempts >= 5)
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      await user.save();
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    user.failed2FAAttempts = 0;
    user.lockUntil = undefined;
    user.is2FAEnabled = true;
    user.twoFactorMethod = "totp";
    await user.save();

    return res.json({
      message: "✅ TOTP verified successfully",
      user: formatUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * CONFIRM TOTP SETUP
 */
exports.confirmTOTPSetup = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user || !user.twoFactorSecret)
      return res.status(400).json({ message: "TOTP setup not initiated" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code.toString().trim(),
      window: 2,
    });
    if (!verified)
      return res.status(400).json({ message: "Invalid code. Try again." });

    user.is2FAEnabled = true;
    user.twoFactorMethod = "totp";
    await user.save();
    res.json({
      message: "✅ TOTP setup confirmed successfully!",
      user: formatUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to confirm TOTP", error: err.message });
  }
};

/**
 * GET PROFILE
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/**
 * UPDATE PROFILE
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, role, avatar } = req.body;
    const userId = req.user.id;
    const BASE_URL =
      process.env.CLIENT_URL || "https://ai-study-assistant-pumn.onrender.com";

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    if (req.file && req.file.filename) {
      updateData.avatar = `${BASE_URL}/api/uploads/${req.file.filename}`;
    } else if (avatar === null || avatar === "null") {
      updateData.avatar = null;
    } else if (avatar) {
      updateData.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    // Ensure avatar has full URL
    if (updatedUser.avatar && !updatedUser.avatar.startsWith("http")) {
      updatedUser.avatar = `${BASE_URL}${updatedUser.avatar}`;
    }
    res.json({
      message: "Profile updated successfully",
      user: formatUser(updatedUser),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

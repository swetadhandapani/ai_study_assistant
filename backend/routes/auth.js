const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  updateProfile,
  getProfile,
  verify2FA,
  toggle2FA,
  resend2FA,
  enableTOTP,
  verifyTOTP,
  confirmTOTPSetup,
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/register",registerValidators, register);
router.post("/login",loginValidators, login);
router.post("/forgot-password",forgotPasswordValidators, forgotPassword);
router.post("/reset-password/:token",resetPasswordValidators, resetPassword);

router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.get("/profile", protect, getProfile);

// 🔐 2FA
router.post("/verify-2fa", verify2FA); // Email OTP verification
router.post("/verify-totp", verifyTOTP); // Authenticator App verification
router.put("/toggle-2fa", protect, toggle2FA);
router.post("/resend-2fa", resend2FA);
router.post("/enable-totp", protect, enableTOTP);
router.post("/confirm-totp", protect, confirmTOTPSetup);

module.exports = router;

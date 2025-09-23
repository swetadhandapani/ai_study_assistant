const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, default: "user" },
  avatar: String,

  // Existing
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date,

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // 🔑 2FA fields
  is2FAEnabled: { type: Boolean, default: false },
  twoFactorMethod: { type: String, enum: ["email", "totp", null], default: null },
  twoFactorSecret: String, // for authenticator app
  temp2FACode: String, // for email OTP
  temp2FAExpires: Date,

  failed2FAAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  last2FAResend: Date,

  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);

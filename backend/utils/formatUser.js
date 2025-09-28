// backend/utils/formatUser.js
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  is2FAEnabled: user.is2FAEnabled,
  twoFactorMethod: user.twoFactorMethod || null,
  avatar: user.avatar || null,
});

module.exports = formatUser;

const express = require("express");
const router = express.Router();

/** @endpoints */
const {
  register,
  login,
  verifyEmailOtp,
  newEmailOtp,
  forgotPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
  updateUser,
  uploadUserAvatar,
  logout,
  getFavoriteDetails,
  removeUserAvatar,
} = require("../controllers/user");

/** @validators */
const {
  registerValidator,
  loginValidator,
  newEmailOtpValidator,
  verifyEmailOtpValidator,
  forgotPasswordOtpValidator,
  verifyPasswordOtpValidator,
  resetPasswordValidator,
  updateUserValidator,
} = require("../services/validators/user");
const { verifyToken } = require("../middlewares/verify-token");

const {
  registerWithGoogle,
  loginWithGoogle,
} = require("../controllers/google-authentication");
const {
  sendNotification,
} = require("../services/notifications/pushy_notifications");

router
  .route("/")
  .post(...registerValidator, register)
  .get(...loginValidator, login)
  .patch(verifyToken, ...updateUserValidator, updateUser);

router
  .route("/email")
  .post(...newEmailOtpValidator, newEmailOtp)
  .patch(...verifyEmailOtpValidator, verifyEmailOtp);

router
  .route("/password")
  .post(...forgotPasswordOtpValidator, forgotPasswordOtp)
  .patch(...verifyPasswordOtpValidator, verifyPasswordOtp);

router.route("/reset-password").patch(...resetPasswordValidator, resetPassword);

router.route("/avatar").patch(verifyToken, uploadUserAvatar);
router.route("/avatar-remove").patch(verifyToken, removeUserAvatar);

router.route("/auth/google").post(registerWithGoogle).get(loginWithGoogle);

// router
//   .route("/auth/facebook")
//   .post(registerWithFacebook)
//   .get(loginWithFacebook);

router.route("/logout").post(logout);

router.route("/favorite").get(verifyToken, getFavoriteDetails);

module.exports = router;

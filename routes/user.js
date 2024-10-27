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
} = require("../services/validators/user");
const { verifyToken } = require("../middlewares/verify-token");

router
  .route("/")
  .post(registerValidator, register)
  .get(loginValidator, login)
  .patch(verifyToken, updateUser);

router
  .route("/email")
  .post(newEmailOtpValidator, newEmailOtp)
  .patch(verifyEmailOtpValidator, verifyEmailOtp);

router
  .route("/password")
  .post(forgotPasswordOtpValidator, forgotPasswordOtp)
  .patch(verifyPasswordOtpValidator, verifyPasswordOtp);

router.route("/reset-password").patch(resetPasswordValidator, resetPassword);

module.exports = router;

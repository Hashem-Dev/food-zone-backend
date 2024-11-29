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
  registerWithGoogle,
  loginWithGoogle,
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
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/")
  .post(registerValidator, register)
  .get(loginValidator, login)
  .patch(verifyToken, updateUserValidator, updateUser);

router
  .route("/email")
  .post(newEmailOtpValidator, newEmailOtp)
  .patch(verifyEmailOtpValidator, verifyEmailOtp);

router
  .route("/password")
  .post(forgotPasswordOtpValidator, forgotPasswordOtp)
  .patch(verifyPasswordOtpValidator, verifyPasswordOtp);

router.route("/reset-password").patch(resetPasswordValidator, resetPassword);

router
  .route("/avatar")
  .post(verifyToken, upload.single("avatar"), uploadUserAvatar);

router.route("/auth/google").post(registerWithGoogle).get(loginWithGoogle);

router.route("/logout").post(verifyToken, logout);

module.exports = router;

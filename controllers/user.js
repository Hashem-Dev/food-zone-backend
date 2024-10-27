const User = require("../models/User");
const bcrypt = require("bcrypt");

const asyncHandler = require("express-async-handler");
const ApiErrors = require("../utils/api-errors");
const { sendRegisterOtp, sendPasswordOtp } = require("../utils/otp-sender");
const {
  accessTokenGenerator,
  refreshTokenGenerator,
} = require("../utils/token-generator");
const ApiSuccess = require("../utils/api-success");

/**
 * @desc Creates a new user account
 * @route POST /api/v1/users/
 * @access public
 */
const register = asyncHandler(async (req, res, next) => {
  const { slug, name, email, password } = req.body;

  const existsUser = await User.findOne({ email });
  if (existsUser) {
    return next(new ApiErrors(req.__("email_exists"), 409));
  }

  const emailOtp = await sendRegisterOtp(email, req.language);
  const emailOtpExpire = Date.now() + 10 * 60 * 1000;

  const newUser = await User.create({
    name,
    slug,
    email,
    password,
    emailOtp,
    emailOtpExpire,
  });

  if (!newUser) {
    return next(new ApiErrors("Could not create new user", 400));
  }

  /** @token */
  newUser.accessToken = accessTokenGenerator(newUser);
  newUser.refreshToken = refreshTokenGenerator(newUser);

  await newUser.save();

  return res.status(201).json(newUser);
});

/**
 * @desc Login user with email and password
 * @route GET /api/v1/users/
 * @access public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    return next(new ApiErrors("The user could not be found", 404));
  }

  const verifyPassword = await bcrypt.compare(password, foundUser.password);
  if (!verifyPassword) {
    return next(new ApiErrors("Login data is not valid", 404));
  }

  if (!(foundUser.emailOtp === 1)) {
    return next(new ApiErrors("You have to verify your email first.", 409));
  }

  foundUser.accessToken = accessTokenGenerator(foundUser);
  foundUser.refreshToken = refreshTokenGenerator(foundUser);

  await foundUser.save();

  foundUser.emailOtp = undefined;
  foundUser.password = undefined;
  foundUser.passwordOtp = undefined;
  return res.status(200).json({ user: foundUser });
});

/**
 * @desc Verify email otp
 * @route PATCH /api/v1/users/email
 * @access public
 */
const verifyEmailOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors("The user could not be found", 404));
  }

  if (user.emailOtp === 1) {
    return next(new ApiSuccess("Your account is verified."));
  }

  const dateNow = new Date();
  const dbDate = new Date(user.emailOtpExpire);
  if (dateNow > dbDate) {
    return next(new ApiErrors("Your verification code has expired", 400));
  }

  if (!(otp === user.emailOtp)) {
    return next(new ApiErrors("The OTP is not valid", 400));
  }

  user.emailOtp = 1;
  user.emailOtpExpire = undefined;
  await user.save();
  return res.status(200).json({
    message: "Your account has been verified",
    accessToken: user.accessToken,
    refreshToken: user.refreshToken,
  });
});

/**
 * @desc Send new email with verification code
 * @route POST /api/v1/users/email
 * @access public
 */
const newEmailOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors("User not found", 404));
  }

  if (user.emailOtp === 1) {
    return next(new ApiSuccess("You already verified your account"));
  }

  const dateNow = new Date();
  const dbDate = new Date(user.emailOtpExpire);
  if (dateNow < dbDate) {
    return next(new ApiErrors("Please wait for the last otp to expire", 400));
  }

  const emailOtp = await sendRegisterOtp(email, req.language);
  const emailOtpExpire = Date.now() + 10 * 60 * 1000;
  user.emailOtp = emailOtp;
  user.emailOtpExpire = emailOtpExpire;

  user.save();

  return next(
    new ApiSuccess("Verification code has been sent to your email address")
  );
});

/**
 * @desc Send a reset password verification code
 * @route POST /api/v1/users/password
 * @access public
 */
const forgotPasswordOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors("User not found", 404));
  }

  const passwordOtp = await sendPasswordOtp(email, req.language);
  const passwordOtpExpire = Date.now() + 10 * 60 * 1000;

  user.passwordOtp = passwordOtp;
  user.passwordOtpExpire = passwordOtpExpire;

  await user.save();

  return next(new ApiSuccess("Your OTP password send to your email"));
});

/**
 * @desc Reset password
 * @route PATH /api/v1/users/reset
 * @access public
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors("User not found", 404));
  }

  if (!(user.passwordOtp === 1)) {
    return next(new ApiErrors("You have to verify your OTP password", 400));
  }

  user.password = newPassword;
  await user.save();
  return next(new ApiSuccess("Your password is updated successfully"));
});

/**
 * @desc Verify OTP password
 * @route PATCH /api/v1/users/password
 * @access public
 */
const verifyPasswordOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiErrors("User not found", 404));
  }

  if (user.passwordOtp === 1) {
    return next(new ApiSuccess("You have already verified otp password "));
  }

  const dateNow = new Date();
  const dbDate = new Date(user.passwordOtpExpire);

  if (dateNow > dbDate || !(user.passwordOtp === otp)) {
    return next(
      new ApiErrors("Your verification code is expire or invalid", 400)
    );
  }

  user.passwordOtp = 1;
  user.passwordOtpExpire = undefined;
  await user.save();

  return next(new ApiSuccess("Otp verification is done successfully"));
});

/**
 * @desc Update user data
 * @route PATCH /api/v1/users/
 * @access protected
 */
const updateUser = asyncHandler(async (req, res, next) => {
  return res.status(200).json({ data: "Update user endpoint" });
});

module.exports = {
  register,
  login,
  verifyEmailOtp,
  newEmailOtp,
  forgotPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
  updateUser,
};

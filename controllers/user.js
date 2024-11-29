const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");

const { sendRegisterOtp, sendPasswordOtp } = require("../utils/otp-sender");
const {
  accessTokenGenerator,
  refreshTokenGenerator,
} = require("../utils/token-generator");
const { uploadImage } = require("../services/uploader/cloudinary");
const { default: slugify } = require("slugify");

/**
 * @desc Creates a new user account
 * @route POST /api/v1/users/
 * @access public
 */
const register = asyncHandler(async (req, res, next) => {
  const { slug, name, email, password, adminAccessKey, vendorAccessKey } =
    req.body;
  let { isAdmin, role } = req.body;
  const existsUser = await User.findOne({ email });
  if (existsUser) {
    return next(new ApiErrors(req.__("email_exists"), 409));
  }

  if (role === "admin") {
    if (isAdmin) {
      if (!adminAccessKey || adminAccessKey !== process.env.ADMIN_ACCESS_KEY) {
        return next(new ApiErrors(req.__("invalid_admin_access_key"), 403));
      }
    } else {
      return next(new ApiErrors(req.__("admin_register_forbidden"), 403));
    }
  } else if (role === "vendor") {
    if (!vendorAccessKey || vendorAccessKey !== process.env.VENDOR_ACCESS_KEY) {
      return next(new ApiErrors(req.__("invalid_vendor_access_key"), 403));
    }
    isAdmin = false;
  } else {
    role = "user";
    isAdmin = false;
  }

  const emailOtp = await sendRegisterOtp(email, req.language);
  const emailOtpExpire = Date.now() + 10 * 60 * 1000;

  const newUser = await User.create({
    name,
    slug,
    email,
    password,
    isAdmin,
    role,
    emailOtp,
    emailOtpExpire,
  });

  if (!newUser) {
    return next(new ApiErrors(req.__("user_create_fail"), 400));
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  const verifyPassword = await bcrypt.compare(password, foundUser.password);
  if (!verifyPassword) {
    return next(new ApiErrors(req.__("login_invalid"), 404));
  }

  if (foundUser.emailOtp !== 1) {
    return next(new ApiErrors(req.__("verify_email_first"), 409));
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (user.emailOtp === 1) {
    return res.status(200).json({
      status: "Success",
      message: req.__("account_verified"),
    });
  }

  const dateNow = new Date();
  const dbDate = new Date(user.emailOtpExpire);
  if (dateNow > dbDate || otp !== user.emailOtp) {
    return next(new ApiErrors(req.__("otp_invalid"), 400));
  }

  user.emailOtp = 1;
  user.emailOtpExpire = undefined;
  await user.save();
  return res.status(200).json({
    message: req.__("account_verified"),
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (user.emailOtp === 1) {
    return res.status(200).json({
      status: "Success",
      message: req.__("account_already_verified"),
    });
  }

  const dateNow = new Date();
  const dbDate = new Date(user.emailOtpExpire);
  if (dateNow < dbDate) {
    return next(new ApiErrors(req.__("otp_wait_expire"), 400));
  }

  const emailOtp = await sendRegisterOtp(email, req.language);
  const emailOtpExpire = Date.now() + 10 * 60 * 1000;
  user.emailOtp = emailOtp;
  user.emailOtpExpire = emailOtpExpire;

  user.save();

  return res.status(200).json({
    status: "Success",
    message: req.__("otp_sent_email"),
  });
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  const passwordOtp = await sendPasswordOtp(email, req.language);
  const passwordOtpExpire = Date.now() + 10 * 60 * 1000;

  user.passwordOtp = passwordOtp;
  user.passwordOtpExpire = passwordOtpExpire;

  await user.save();

  return res.status(200).json({
    status: "Success",
    message: req.__("otp_sent_success"),
  });
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (user.passwordOtp !== 1) {
    return next(new ApiErrors(req.__("otp_verify_required"), 400));
  }

  user.password = newPassword;
  user.passwordOtp = 0;
  await user.save();
  return res.status(200).json({
    status: "Success",
    message: req.__("password_update_success"),
  });
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (user.passwordOtp === 1) {
    return res.status(200).json({
      status: "Success",
      message: req.__("otp_already_verified"),
    });
  }

  const dateNow = new Date();
  const dbDate = new Date(user.passwordOtpExpire);

  if (dateNow > dbDate || user.passwordOtp !== otp) {
    return next(new ApiErrors(req.__("otp_invalid"), 400));
  }

  user.passwordOtp = 1;
  user.passwordOtpExpire = undefined;
  await user.save();

  return res.status(200).json({
    status: "Success",
    message: req.__("otp_verification_success"),
  });
});

/**
 * @desc Update user data
 * @route PATCH /api/v1/users/
 * @access protected
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  const { email, password, phone } = req.body;
  const name = req.body.name;
  const slug = req.body.slug;

  const user = await User.findById(userId);
  if (!user) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (email) {
    if (email === user.email) {
      return next(new ApiErrors(req.__("email_belong_to_account"), 409));
    }
    const existsEmail = await User.findOne({ email });
    if (existsEmail) {
      return next(new ApiErrors(req.__("email_already_in_use"), 409));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    { _id: userId },
    { $set: { name, slug, email, password, phone } },
    { new: true, context: { req: req } }
  );

  if (!updatedUser) {
    return next(new ApiErrors(req.__("user_update_fail"), 400));
  }

  return res.status(200).json({ updatedUser });
});

/**
 * @desc Upload user avatar
 * @route POST /api/v1/users/avatar
 * @access protected
 */
const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  const user = await User.findById(userId);
  const image = await uploadImage(req.file, "Avatar", "avatar");
  console.log(uploadImage);
  if (!user) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  user.avatar.url = image.url;
  user.avatar.publicId = image.publicId;
  await user.save();

  return res
    .status(200)
    .json({ status: "Success", message: req.__("profile_image_added") });
});

/**
 * @desc Logout user
 * @route POST /api/v1/users/logout
 * @access protected
 */
const logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = await User.findOneAndUpdate(
    { refreshToken },
    { $set: { logout: new Date(), refreshToken: null, accessToken: null } },
    { new: true }
  );

  if (!user) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  return res.status(200).json({ status: "Success", message: "logout_success" });
});

/**
 * @desc Create new user with Google authentication
 * @route POST /api/v1/auth/google
 * @access public
 */

const registerWithGoogle = asyncHandler(async (req, res, next) => {
  const { googleId, email, imageUrl, displayName } = req.body;
  const user = await User.findOne({ googleId, email });
  if (user) {
    return next(
      new ApiErrors("This email already exist, you have to login", 409)
    );
  }
  const newUser = await User.create({
    googleId,
    name: { en: displayName, ar: displayName },
    slug: slugify(displayName),
    email,
    avatar: { url: imageUrl },
    password: "Set your password",
    role: "user",
    emailOtp: 1,
  });
  if (!newUser) {
    return next(new ApiErrors("User Unauthenticated.", 400));
  }
  newUser.accessToken = accessTokenGenerator(newUser);
  newUser.refreshToken = refreshTokenGenerator(newUser);

  await newUser.save();

  return res
    .status(201)
    .json({ message: `Registered as ${email}`, user: newUser });
});

/**
 * @desc Login user with Google authentication
 * @route GET /api/v1/auth/google
 * @access public
 */

const loginWithGoogle = asyncHandler(async (req, res, next) => {
  const { googleId, email } = req.body;
  const foundUser = await User.findOne({ googleId, email });
  if (!foundUser) {
    return next(
      new ApiErrors(
        "This google account is not authenticated, register it first.",
        404
      )
    );
  }
  const accessToken = accessTokenGenerator(foundUser);
  const refreshToken = refreshTokenGenerator(foundUser);

  foundUser.accessToken = accessToken;
  foundUser.refreshToken = refreshToken;

  await foundUser.save();

  foundUser.emailOtp = undefined;
  foundUser.password = undefined;
  foundUser.passwordOtp = undefined;
  return res
    .status(200)
    .json({ message: `Authenticated as ${email}`, user: foundUser });
});

module.exports = {
  register,
  registerWithGoogle,
  login,
  loginWithGoogle,
  verifyEmailOtp,
  newEmailOtp,
  forgotPasswordOtp,
  verifyPasswordOtp,
  resetPassword,
  updateUser,
  uploadUserAvatar,
  logout,
};

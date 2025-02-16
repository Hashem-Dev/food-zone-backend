const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");

const { sendRegisterOtp, sendPasswordOtp } = require("../utils/otp-sender");
const {
  accessTokenGenerator,
  refreshTokenGenerator,
} = require("../utils/token-generator");

const { registerIcon, Notification } = require("../models/Notification");
const {
  sendNotificationToUser,
} = require("../services/notifications/pushy_notifications");

/**
 * @desc Creates a new user account
 * @route POST /api/v1/users/
 * @access public
 */
const register = asyncHandler(async (req, res, next) => {
  const {
    slug,
    name,
    email,
    password,
    adminAccessKey,
    vendorAccessKey,
    deviceToken,
    deviceAuthKey,
  } = req.body;
  let { isAdmin, role } = req.body;
  const existsUser = await User.findOne({ email });
  if (existsUser) {
    return next(new ApiErrors(req.__("email_exists"), 409));
  }

  const roleConfig = {
    admin: {
      accessKey: process.env.ADMIN_ACCESS_KEY,
      errorMessage: req.__("invalid_admin_access_key"),
    },
    vendor: {
      accessKey: process.env.VENDOR_ACCESS_KEY,
      errorMessage: req.__("invalid_vendor_access_key"),
    },
    user: { accessKey: null, errorMessage: null },
  };

  if (roleConfig[role] && roleConfig[role].accessKey) {
    if (
      !req.body[`${role}AccessKey`] ||
      req.body[`${role}AccessKey`] !== roleConfig[role].accessKey
    ) {
      return next(new ApiErrors(roleConfig[role].errorMessage, 403));
    }
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
    deviceToken,
    deviceAuthKey,
  });

  if (!newUser) {
    return next(new ApiErrors(req.__("user_create_fail"), 400));
  }

  if (deviceToken != null) {
    /** @notification */
    const notifyTitle = "Verify Account";
    const notifyMessage = "Please visit your email to verify your account.";

    await sendNotificationToUser(notifyTitle, notifyMessage, deviceToken);

    const notification = await Notification.create({
      user: newUser._id,
      title: notifyTitle,
      message: notifyMessage,
      icon: { ...registerIcon },
    });

    await notification.save();
    newUser.notifications.push(notification._id);
    await newUser.save();
  }

  return res.status(201).json({ message: req.__("user_create_success") });
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

  if (foundUser.emailOtp > 1) {
    return next(new ApiErrors(req.__("verify_email_first"), 409));
  }

  const [accessToken, refreshToken] = [
    accessTokenGenerator(foundUser),
    refreshTokenGenerator(foundUser),
  ];

  let notificationsConfig = [];

  if (foundUser.firstLogin) {
    notificationsConfig = [
      {
        title: "أهلاً بك في فود زون",
        message: "استمتع بتصفح أفضل الوجبات والمطاعم.",
      },
      {
        title: "الملف الشخصي",
        message: "من فضلك قم بإكمال الملف الشخصي",
      },
    ];

    const notificationPromise = notificationsConfig.map(({ title, message }) =>
      Notification.create({
        user: foundUser._id,
        title: title,
        message: message,
        icon: { ...registerIcon },
      }),
    );

    const createNotifications = await Promise.all(notificationPromise);

    await User.findByIdAndUpdate(
      foundUser._id,
      {
        $push: {
          notifications: { $each: createNotifications.map((not) => not._id) },
        },
      },
      { new: true },
    );

    notificationsConfig.forEach(({ title, message }) => {
      sendNotificationToUser(title, message, foundUser.deviceToken, next);
    });
  } else {
    await sendNotificationToUser(
      "أهلاً بعودتك",
      "استكتشف الجديد من الوجبات والمطاعم التي تلبي ذوقك",
      foundUser.deviceToken,
      next,
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    { _id: foundUser._id },
    {
      accessToken,
      refreshToken,
      firstLogin: false,
      $unset: { emailOtp: 1, passwordOtp: 1, __v: 1 },
    },
    {
      new: true,
      select:
        "-password -passwordOtp -emailOtp -__v -firstLogin -googleId -deviceAuthKey",
    },
  );

  return res.status(200).json({ user: updatedUser });
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
  const { email, password, phone, dateOfBirth, gender } = req.body;
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
    { $set: { name, slug, email, password, phone, dateOfBirth, gender } },
    { new: true, context: { req: req } },
  );

  if (!updatedUser) {
    return next(new ApiErrors(req.__("user_update_fail"), 400));
  }

  return res.status(200).json({ user: updatedUser });
});

/**
 * @desc Upload user avatar
 * @route POST /api/v1/users/avatar
 * @access protected
 */
const uploadUserAvatar = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  const { image, publicId } = req.query;
  if (!image) {
    return next(new ApiErrors("Image is required.", 400));
  }
  const user = await User.findById(userId);

  if (!user) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  user.avatar.url = image;
  user.avatar.publicId = publicId;
  await user.save();

  return res.status(200).json({ user: user });
});

/**
 * @desc Remove user avatar
 * @route PATCH /api/v1/avatar-remove
 * @access protected
 */
const removeUserAvatar = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const defaultImage =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found.", 404));
  }

  foundUser.avatar.url = defaultImage;
  foundUser.avatar.publicId = "default";
  await foundUser.save();
  return res.status(200).json({ user: foundUser });
});

/**
 * @desc Logout user
 * @route POST /api/v1/users/logout
 * @access protected
 */
const logout = asyncHandler(async (req, res, next) => {
  const { id } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: id },
    { $set: { logout: new Date(), refreshToken: null, accessToken: null } },
    { new: true },
  );

  if (!user) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  await sendNotificationToUser(
    "Good Bye!",
    "We will miss you, Come back later.",
    user.deviceToken,
    next,
  );

  return res.status(200).json({ status: "Success", message: "logout_success" });
});

/**
 * @desc Get all user favorite with details
 * @route GET /api/v1/user/favorite
 * @access protected
 */
const getFavoriteDetails = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { detailType } = req.query;
  let selection;

  if (!detailType) {
    return next(new ApiErrors("you must provide detail type", 400));
  }

  if (detailType === "meals") {
    selection = "favoriteMeals";
  } else if (detailType === "restaurants") {
    selection = "favoriteRestaurants";
  }

  const foundUser = await User.findById(user).select(selection);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  if (detailType === "meals") {
    const meals = await foundUser.populate({
      path: "favoriteMeals.meals",
      select: "title price priceWithoutDiscount time rating images restaurant",
      populate: {
        path: "restaurant",
        select: "title logo",
      },
    });
    return res.status(200).json({ type: "meal", meals });
  } else if (detailType === "restaurants") {
    const restaurants = await foundUser.populate({
      path: "favoriteRestaurants.restaurant",
      select: "title logo rating coords cover time",
    });

    return res.status(200).json({ type: "restaurant", restaurants });
  }

  return res.status(200).json(foundUser);
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
  uploadUserAvatar,
  logout,
  getFavoriteDetails,
  removeUserAvatar,
};

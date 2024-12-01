const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");
const {
  accessTokenGenerator,
  refreshTokenGenerator,
} = require("../utils/token-generator");
const { default: slugify } = require("slugify");

/**
 * @desc Create new user with Google authentication
 * @route POST /api/v1/auth/google
 * @access public
 */
const registerWithGoogle = asyncHandler(async (req, res, next) => {
  const { googleId, email, imageUrl, displayName } = req.body;
  const user = await User.findOne({ googleId, email });
  if (user) {
    return next(new ApiErrors("This email already exist", 409));
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
  const foundUser = await User.findOne({ email });
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

  foundUser.googleId = googleId;
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
  registerWithGoogle,
  loginWithGoogle,
};

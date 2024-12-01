const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");
const { default: slugify } = require("slugify");
const {
  accessTokenGenerator,
  refreshTokenGenerator,
} = require("../utils/token-generator");

/**
 * @desc Create new user with Facebook
 * @route POST /api/v1/auth/facebook
 * @access public
 */
const registerWithFacebook = asyncHandler(async (req, res, next) => {
  const { facebookId, email, name, imageUrl } = req.body;

  const foundUser = await User.findOne({ email });
  if (foundUser) {
    return next(new ApiErrors("This account already exist.", 409));
  }

  const newUser = await User.create({
    facebookId,
    name: { en: name, ar: name },
    slug: slugify(name),
    email,
    password: "Set your password",
    avatar: { url: imageUrl },
    role: "user",
    emailOtp: 1,
  });

  if (!newUser) {
    return next(new ApiErrors(`Failed with creating account.`));
  }

  newUser.accessToken = accessTokenGenerator(newUser);
  newUser.refreshToken = refreshTokenGenerator(newUser);

  await newUser.save();
  return res
    .status(201)
    .json({ message: `Authenticated as ${email}`, user: newUser });
});

/**
 * @desc Login with Facebook
 * @route GET /api/v1/auth/facebook
 * @access public
 */

const loginWithFacebook = asyncHandler(async (req, res, next) => {
  const { email, facebookId } = req.body;
  const foundUser = await User.findOne({ email });
  if (!foundUser) {
    return next(new ApiErrors("Authentication Failed", 404));
  }
  foundUser.facebookId = facebookId;
  foundUser.accessToken = accessTokenGenerator(foundUser);
  foundUser.refreshToken = refreshTokenGenerator(foundUser);
  await foundUser.save();

  return res
    .status(200)
    .json({ message: `Authenticated as ${email}`, user: foundUser });
});
module.exports = {
  registerWithFacebook,
  loginWithFacebook,
};

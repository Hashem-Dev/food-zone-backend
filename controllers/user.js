const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiErrors = require("../utils/api-errors");
const { sendRegisterOtp } = require("../utils/otp-sender");
const secretKey = process.env.SECRET_KEY_TOKEN;

const register = asyncHandler(async (req, res, next) => {
  const { slug, name, email, password } = req.body;

  // const existsUser = await User.findOne({ email });
  // if (existsUser) {
  //   return next(new ApiErrors("E-mail already exists", 409));
  // }

  const hashPassword = await bcrypt.hash(password, 12);
  const accessToken = jwt.sign({ email }, secretKey, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ email }, secretKey, { expiresIn: "7d" });
  const emailOtp = sendRegisterOtp(email, req.language);
  console.log(emailOtp);
  // const newUser = await User.create({
  //   name: name,
  //   slug,
  //   email,
  //   password: hashPassword,
  //   accessToken,
  //   refreshToken,
  // });

  // if (!newUser) {
  //   return next(new ApiErrors("Could not create new user", 400));
  // }
  return res.status(201).json(1);
});

module.exports = {
  register,
};

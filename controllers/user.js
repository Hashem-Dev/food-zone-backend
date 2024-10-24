const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../services/try-catch");

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const existsUser = await User.findOne({ email });
  if (existsUser) {
    return next(new ApiErrors("E-mail already exists", 409));
  }

  const hashPassword = await bcrypt(password, 12);
});

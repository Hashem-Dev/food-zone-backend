const asyncHandler = require("express-async-handler");
const ApiErrors = require("../utils/api-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { accessTokenGenerator } = require("../utils/token-generator");
const tokenSecretKey = process.env.SECRET_KEY_TOKEN;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader =
      req.headers["Authorization"] || req.headers.authorization;
    if (!authHeader) {
      return next(new ApiErrors("This route requires authorization", 403));
    }
    const token = authHeader.replace("Bearer ", "").trim();
    jwt.verify(token, tokenSecretKey, async (error, user) => {
      if (error) {
        return await refreshToken(token, req, res, next);
      }

      return res.status(200).json(user);
    });
  } catch (error) {
    return next(new ApiErrors(error.message, 403));
  }
};

const refreshToken = asyncHandler(async (token, req, res, next) => {
  const data = jwt.decode(token);

  const user = await User.findById(data.id);
  if (!user) {
    return next(new ApiErrors("This user not found in database", 404));
  }

  const verifyToken = jwt.verify(user.accessToken, tokenSecretKey, (error) => {
    if (error) {
      if (error.message.includes("jwt expired")) {
        return false;
      }
    } else {
      return true;
    }
  });
  if (!verifyToken) {
    return next(new ApiErrors("You have to login again to refresh token", 403));
  }
  const newAccessToken = accessTokenGenerator(user);
  req.headers["Authorization"] = "Bearer " + newAccessToken;
  user.accessToken = newAccessToken;
  await user.save();
  next();
});

module.exports = {
  verifyToken,
};

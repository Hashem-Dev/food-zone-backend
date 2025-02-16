const asyncHandler = require("express-async-handler");
const ApiErrors = require("../utils/api-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { accessTokenGenerator } = require("../utils/token-generator");
const mongoose = require("mongoose");
const tokenSecretKey = process.env.SECRET_KEY_TOKEN;

/**
 * @desc Middleware to verify users token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader =
      req.headers["Authorization"] || req.headers.authorization;
    if (!authHeader) {
      return next(new ApiErrors("This route requires authorization", 403));
    }
    const token = authHeader.replace("Bearer ", "").trim();

    jwt.verify(token, tokenSecretKey, async (error) => {
      const data = jwt.decode(token);
      const user = await User.findById(data.id);

      if (!user) {
        return res.status(401).json({ message: "Unauthorized access" });
      }

      if (data.iat * 1000 < new Date(user.logout).getTime()) {
        return next(
          new ApiErrors("Your session has expired. Please login again.", 401)
        );
      }

      if (error) {
        if (error.message.includes("invalid algorithm")) {
          return next(new ApiErrors("This token is invalid.", 401));
        } else if (error.message.includes("invalid signature")) {
          return next(new ApiErrors("This token is invalid.", 401));
        } else if (error.message.includes("invalid token")) {
          return next(new ApiErrors("This token is invalid.", 401));
        } else if (error.message.includes("jwt expired")) {
          return await refreshToken(token, req, res, next);
        } else if (error.name === "JsonWebTokenError") {
          return next(new ApiErrors("Invalid token", 401));
        } else if (error.name === "NotBeforeError") {
          return next(new ApiErrors("Token used before issued", 401));
        } else {
          return next(new ApiErrors("Unauthorized access", 401));
        }
      } else if (!error) {
        const data = jwt.decode(token, tokenSecretKey);
        req.user = data.id;
        req.isAdmin = data.isAdmin;
        next();
      }
    });
  } catch (error) {
    return next(new ApiErrors(error.message, 403));
  }
};

/**
 * @desc Middleware to refresh access token
 */
const refreshToken = asyncHandler(async (token, req, res, next) => {
  const data = jwt.decode(token);

  if (!mongoose.isValidObjectId(data.id)) {
    return next(
      new ApiErrors("The user you are trying to login not in our system", 403)
    );
  }

  const user = await User.findById(data.id);
  if (!user) {
    return next(new ApiErrors("This user not found in database", 404));
  }

  if (!user.refreshToken) {
    return next(
      new ApiErrors(
        "You must be logged in to refresh your authentication token",
        403
      )
    );
  }

  const verifyToken = jwt.verify(user.refreshToken, tokenSecretKey, (error) => {
    if (error) {
      if (error.message.includes("jwt expired")) {
        return false;
      }
    } else {
      return true;
    }
  });

  if (!verifyToken) {
    return next(new ApiErrors("You have to login again to refresh token", 401));
  }

  const newAccessToken = accessTokenGenerator(user);
  req.headers["Authorization"] = "Bearer " + newAccessToken;
  req.user = user.id;
  user.accessToken = newAccessToken;
  await user.save();
  next();
});

/**
 * @desc Middleware to verify admin token
 */
const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["Authorization"];
  if (!authHeader) {
    return next(
      new ApiErrors("This request is not authorized, token is required", 401)
    );
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const data = jwt.decode(token, tokenSecretKey);
  const isAdmin = data.isAdmin;
  const role = data.role;
  if (!isAdmin || !(role === "admin")) {
    return next(
      new ApiErrors("You are not authenticated to access this admin route", 403)
    );
  }

  return next();
};

/**
 * @desc Middleware to verify vendor token
 */
const verifyVendorToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers["Authorization"];
  if (!authHeader) {
    return next(
      new ApiErrors("This request is not authorized, token is required", 401)
    );
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const data = jwt.decode(token, tokenSecretKey);

  const role = data.role;
  if (!(role === "vendor")) {
    return next(
      new ApiErrors(
        "You are not authenticated to access this vendor route",
        403
      )
    );
  }

  return next();
};
module.exports = {
  verifyToken,
  verifyAdminToken,
  verifyVendorToken,
};

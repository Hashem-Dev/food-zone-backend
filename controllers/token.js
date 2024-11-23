const asyncHandler = require("express-async-handler");

const checkUserToken = asyncHandler(async (req, res, next) => {
  return res.status(200).json({ status: true });
});

module.exports = checkUserToken;

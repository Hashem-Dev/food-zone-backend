const { validationResult } = require("express-validator");
const ApiErrors = require("../utils/api-errors");

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMsgs = errors.errors.map((error) => error.msg);

    return next(new ApiErrors(errorMsgs[0], 400));
  }
  return next();
};

const validationMessage = (req, key) => {
  return req.__(key);
};

module.exports = {
  validationMiddleware,
  validationMessage,
};

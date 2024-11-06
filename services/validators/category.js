const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");

const felidValidator = (felid, optional = false) => {
  const validation = check(felid);

  if (optional) {
    validation.optional();
  }

  validation
    .notEmpty()
    .withMessage(`${felid} is required`)
    .isString()
    .trim()
    .withMessage(`${felid} must be string`)
    .isLength({ min: 4, max: 32 })
    .withMessage(`${felid} must be between 4-32 character`);

  return validation;
};

const createCategoryValidator = [
  felidValidator("title.en"),
  felidValidator("title.ar"),
  validationMiddleware,
];
const updateCategoryValidator = [
  felidValidator("title.en", true),
  felidValidator("title.ar", true),
  validationMiddleware,
];

module.exports = { createCategoryValidator, updateCategoryValidator };

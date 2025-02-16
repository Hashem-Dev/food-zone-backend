const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");

const fieldValidator = (filed, optional = false) => {
  const validation = check(filed);

  if (optional) {
    validation.optional();
  }

  validation
    .notEmpty()
    .withMessage(`${filed} is required`)
    .isString()
    .trim()
    .withMessage(`${filed} must be string`)
    .isLength({ min: 4, max: 32 })
    .withMessage(`${filed} must be between 4-32 character`);

  return validation;
};

const createCategoryValidator = [
  fieldValidator("title.en"),
  fieldValidator("title.ar"),
  validationMiddleware,
];
const updateCategoryValidator = [
  fieldValidator("title.en", true),
  fieldValidator("title.ar", true),
  validationMiddleware,
];

module.exports = { createCategoryValidator, updateCategoryValidator };

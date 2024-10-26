const { check } = require("express-validator");
const {
  validationMessage,
  validationMiddleware,
} = require("../../middlewares/api-validation");
const { slugifyName } = require("../../utils/api-slugify");

const validateName = (name) => {
  return check(name)
    .isString()
    .trim()
    .withMessage((value, { req }) => {
      return req.__("name_str");
    })
    .trim()
    .isLength({ min: 8 })
    .withMessage("Name length must be a greater than 8")
    .isLength({ max: 32 })
    .withMessage("Name is too long")
    .custom((name, { req }) => {
      slugifyName(name, req);
      return true;
    });
};

const registerValidator = [
  validateName("username"),

  check("email").isEmail().withMessage("Please enter a valid email address"),
  check("password")
    .isStrongPassword()
    .withMessage(
      "The password must be at least 8 characters long and one symbol and one capital letter"
    ),
  validationMiddleware,
];

module.exports = {
  registerValidator,
};

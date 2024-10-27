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
    .withMessage((_, { req }) => {
      return validationMessage(req, "name_str");
    })
    .isLength({ min: 8 })
    .withMessage((_, { req }) => {
      return validationMessage(req, "name_min");
    })
    .isLength({ max: 32 })
    .withMessage((_, { req }) => {
      return validationMessage(req, "name_max");
    })
    .custom((name, { req }) => {
      slugifyName(name, req);
      return true;
    });
};

const validateEmail = (email) => {
  return check(email)
    .isEmail()
    .withMessage((_, { req }) => {
      return validationMessage(req, "email_invalid");
    });
};

const validatePassword = (password) => {
  return check(password)
    .isStrongPassword()
    .withMessage((_, { req }) => {
      return validationMessage(req, "password_req");
    });
};

const validateOtp = (otp) => {
  return check(otp)
    .notEmpty()
    .withMessage("OTP required")
    .isNumeric()
    .withMessage("OTP must be a number");
};

const registerValidator = [
  validateName("username"),
  validateEmail("email"),
  validatePassword("password"),
  validationMiddleware,
];

const loginValidator = [
  validateEmail("email"),
  validatePassword("password"),
  validationMiddleware,
];

const newEmailOtpValidator = [validateEmail("email"), validationMiddleware];

const verifyEmailOtpValidator = [
  validateEmail("email"),
  validateOtp("otp"),
  validationMiddleware,
];

const forgotPasswordOtpValidator = [
  validateEmail("email"),
  validationMiddleware,
];

const verifyPasswordOtpValidator = [
  validateEmail("email"),
  validateOtp("otp"),
  validationMiddleware,
];

const resetPasswordValidator = [
  validateEmail("email"),
  validatePassword("newPassword"),
  validationMiddleware,
];
module.exports = {
  registerValidator,
  loginValidator,
  newEmailOtpValidator,
  verifyEmailOtpValidator,
  forgotPasswordOtpValidator,
  verifyPasswordOtpValidator,
  resetPasswordValidator,
};

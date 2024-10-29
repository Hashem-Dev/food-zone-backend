const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");

const deleteUserValidator = [
  check("id").isMongoId().withMessage("The user is not a valid user"),
  validationMiddleware,
];

module.exports = {
  deleteUserValidator,
};

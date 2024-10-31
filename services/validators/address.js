const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");
const ApiErrors = require("../../utils/api-errors");

const countryValidator = (country, optional = false) => {
  const validator = check(country);
  if (optional) {
    validator.optional();
  }
  validator
    .isString()
    .withMessage("Country name must be string")
    .isLength({ min: 3 })
    .withMessage("Country name is too short")
    .isLength({ max: 32 })
    .withMessage("Country name is too long");
  return validator;
};

const locationValidator = (location, optional = false, next) => {
  const validation = check(location);
  if (optional) {
    validation.optional();
  }

  validation
    .exists()
    .withMessage("Location is required")
    .isObject()
    .withMessage("Location must be an object")
    .custom((location) => {
      if (!location.coordinates || location.coordinates.length !== 2) {
        throw new ApiErrors(
          "Coordinates are required and must contain [longitude, latitude]",
          400
        );
      }
      return true;
    });

  return validation;
};

const addressIdValidator = (id) => {
  return check(id).isMongoId().withMessage("Id address is not valid");
};

const addAddressValidator = [
  countryValidator("country"),
  locationValidator("location"),
  validationMiddleware,
];

const setDefaultAddressValidator = [
  addressIdValidator("addressId"),
  validationMiddleware,
];

const deleteAddressValidator = [
  addressIdValidator("addressId"),
  validationMiddleware,
];

const updateAddressValidator = [
  countryValidator("country", true),
  locationValidator("location", true),
  validationMiddleware,
];

module.exports = {
  addAddressValidator,
  setDefaultAddressValidator,
  deleteAddressValidator,
  updateAddressValidator,
};

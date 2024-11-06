const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");

const addRestaurantValidator = [
  check("title.ar").exists().withMessage("Title مطلوب").isString(),
  check("title.en").exists().withMessage("Title مطلوب").isString(),
  check("time").exists().withMessage("time مطلوب").isString(),

  check("coords.latitude")
    .notEmpty()
    .withMessage("Latitude required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be number"),

  check("coords.longitude")
    .exists()
    .withMessage("Longitude required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude  - 180"),

  validationMiddleware,
];

const restaurantIdValidator = [
  check("id").isMongoId().withMessage("Restaurant id is not valid"),
  validationMiddleware,
];

const restaurantRatingValidator = [
  check("id").isMongoId().withMessage("Restaurant id is not valid"),
  check("userRating")
    .notEmpty()
    .withMessage("User rating must be provided")
    .isNumeric()
    .withMessage("User rating must be number")
    .isLength({ min: 1, max: 5 })
    .withMessage("User rating must be between 1 - 5"),
  validationMiddleware,
];

module.exports = {
  addRestaurantValidator,
  restaurantIdValidator,
  restaurantRatingValidator,
};

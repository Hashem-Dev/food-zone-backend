const { check } = require("express-validator");
const { validationMiddleware } = require("../../middlewares/api-validation");
const ApiErrors = require("../../utils/api-errors");

const titleValidator = (title, optional = false) => {
  const validator = check(title);
  if (optional) {
    validator.optional();
  }

  validator
    .isString()
    .withMessage("Title must be string")
    .trim()
    .notEmpty()
    .withMessage("Title required")
    .isLength({ min: 4, max: 32 })
    .withMessage("Title must be between 4-32 character.");

  return validator;
};

const timeValidator = (time, optional = false) => {
  const validator = check(time);
  if (optional) {
    validator.optional();
  }

  validator
    .isString()
    .withMessage("Time must be string")
    .trim()
    .notEmpty()
    .withMessage("Time required")
    .isLength({ min: 2, max: 7 })
    .withMessage("Time must be between 2-7 character.");

  return validator;
};

const foodTagsValidator = (tags, optional = false) => {
  const validator = check(tags);

  if (optional) {
    validator.optional();
  }

  validator.custom((value, { req }) => {
    if (!value) {
      throw new ApiErrors("Food tags required");
    }

    const tags = value.split(",");
    if (tags.length < 1) {
      throw new ApiErrors("Food tags array must be at least 1 tag");
    }

    req.foodTags = tags;
    return true;
  });

  return validator;
};

const foodTypesValidator = (types, optional = false) => {
  const validator = check(types);

  if (optional) {
    validator.optional();
  }

  validator.custom((value, { req }) => {
    if (!value) {
      throw new ApiErrors("Food types required");
    }

    const types = value.split(",");
    if (types.length < 1) {
      throw new ApiErrors("Food types array must be at least 1 tag");
    }
    req.foodType = types;
    return true;
  });

  return validator;
};

const latitudeValidator = (lat, optional = false) => {
  const validator = check(lat);

  if (optional) {
    validator.optional();
  }

  validator
    .notEmpty()
    .withMessage("Latitude required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be number");
  return validator;
};

const longitudeValidator = (lon, optional = false) => {
  const validator = check(lon);

  if (optional) {
    validator.optional();
  }

  validator
    .notEmpty()
    .withMessage("Longitude required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude  - 180");
  return validator;
};

const idValidator = (id, optional = false) => {
  const validator = check(id);
  if (optional) {
    validator.optional();
  }
  validator.isMongoId().withMessage(`${id} is not valid id`);
  return validator;
};

const descriptionValidator = (desc, optional = false) => {
  const validator = check(desc);

  if (optional) {
    validator.optional();
  }

  validator
    .isString()
    .withMessage("Description must be string")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20 })
    .withMessage("Description is too short");
  return validator;
};

const priceValidator = (price, optional = false) => {
  const validator = check(price);
  if (optional) {
    validator.optional();
  }

  validator
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a float number");

  return validator;
};

const imagesValidator = (images, optional = false) => {
  const validator = check(images);

  if (optional) {
    validator.optional();
  }

  validator.custom((value, { req }) => {
    if (!req.files) {
      throw new ApiErrors("You must at least one image");
    }

    let images = [];

    req.files.forEach((file) => {
      images.push(file.filename);
    });

    req.images = images;
    return true;
  });

  return validator;
};

const specificMealsValidator = [idValidator("id"), validationMiddleware];

const addMealValidation = [
  titleValidator("title"),
  timeValidator("time"),
  foodTagsValidator("foodTags"),
  foodTypesValidator("foodType"),
  latitudeValidator("coords.latitude"),
  longitudeValidator("coords.longitude"),
  idValidator("category"),
  idValidator("restaurant"),
  descriptionValidator("description"),
  priceValidator("price"),
  imagesValidator("images"),
  validationMiddleware,
];

const categoryMealValidator = [idValidator("category"), validationMiddleware];

const restaurantMealValidator = [
  idValidator("restaurant"),
  validationMiddleware,
];

const addMealRatingValidator = [
  idValidator("id"),
  check("userRating")
    .notEmpty()
    .withMessage("User rating is required")
    .isNumeric()
    .withMessage("User rating must be number between 1 and 5"),
  validationMiddleware,
];

module.exports = {
  addMealValidation,
  categoryMealValidator,
  restaurantMealValidator,
  addMealRatingValidator,
  specificMealsValidator,
};

const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const Category = require("../models/Category");
const Restaurant = require("../models/Restaurant");
const Meal = require("../models/Meals");
const User = require("../models/User");
const Rating = require("../models/Rating");
const ApiErrors = require("../utils/api-errors");
const ApiSuccess = require("../utils/api-success");
const { uploadImage } = require("../services/uploader/cloudinary");

/**
 * @desc Add new meal
 * @route POST /api/v1/meal/
 * @access protected
 */
const addMeal = asyncHandler(async (req, res, next) => {
  const { title, time, category, coords, restaurant, description, price } =
    req.body;

  const uploadImages = req.files.map((image, index) => {
    const folder = `Meal/${slugify(title.en).toLowerCase()}`;
    const prefix = `meal-${index}`;
    return uploadImage(image, folder, prefix);
  });

  const images = await Promise.all(uploadImages);

  const foodType = {
    en: req.body.foodType.en.split(","),
    ar: req.body.foodType.ar.split(","),
  };

  const foodTags = {
    en: req.body.foodTags.en.split(","),
    ar: req.body.foodTags.ar.split(","),
  };

  const additives = {
    en: JSON.parse(req.body.additives.en),
    ar: JSON.parse(req.body.additives.ar),
  };

  /** @category */
  const foundCategory = await Category.findById(category);
  if (!foundCategory) {
    return next(
      new ApiErrors(req.__("category_not_found_for_id") + `${category}`, 404)
    );
  }

  /** @restaurant */
  const foundRestaurant = await Restaurant.findById(restaurant);
  if (!foundRestaurant) {
    return next(
      new ApiErrors(
        req.__("restaurant_not_found_for_id") + `${restaurant}`,
        404
      )
    );
  }

  /** @meals */
  const newMeal = await Meal.create({
    title,
    time,
    category,
    foodTags,
    foodType,
    coords,
    restaurant,
    description,
    price,
    additives,
    images,
  });

  if (!newMeal) {
    return next(new ApiErrors(req.__("create_meal_failed"), 400));
  }

  foundRestaurant.foods = newMeal._id;
  foundRestaurant.save();

  return res
    .status(201)
    .json(new ApiSuccess(req.__("create_meal_success"), newMeal));
});

/**
 * @desc Get meals that's belong to specific category
 * @route GET /api/v1/meal/:category
 * @access public
 */
const getCategoryMeals = asyncHandler(async (req, res, next) => {
  /** @category */
  const category = req.params.category;
  const foundCategory = await Category.findById({ _id: category });
  if (!foundCategory) {
    return next(new ApiErrors(req.__("category_not_found"), 404));
  }

  /** @meals */
  const meals = await Meal.aggregate([
    { $match: { category: foundCategory._id } },
    { $sample: { size: 5 } },
  ]);

  if (!meals) {
    return next(new ApiErrors(req.__("category_meals_not_found"), 404));
  }

  return res
    .status(200)
    .json(new ApiSuccess(req.__("meal_for") + `${foundCategory.title}`, meals));
});

/**
 * @desc Get meals that's belong to specific restaurant
 * @route GET /api/v1/meal/restaurant/:restaurant
 * @access public
 */
const getRestaurantMeals = asyncHandler(async (req, res, next) => {
  /** @restaurant */
  const restaurant = req.params.restaurant;
  const foundRestaurant = await Restaurant.findById(restaurant);
  if (!foundRestaurant) {
    return next(new ApiErrors(req.__("restaurant_not_found_for_id"), 404));
  }
  /** @meals */
  const meals = await Meal.aggregate([
    { $match: { restaurant: foundRestaurant._id } },
    { $sample: { size: 5 } },
  ]);

  if (!meals) {
    return next(new ApiErrors(req.__("category_meals_not_found"), 404));
  }

  return res
    .status(200)
    .json(
      new ApiSuccess(req.__("meal_for") + `${foundRestaurant.title}`, meals)
    );
});

/**
 * @desc Get a specific meal
 * @route GET /api/v1/meal/:id
 * @access public
 */
const getSpecificMeal = asyncHandler(async (req, res, next) => {
  const meal = req.params.id;
  const foundMeal = await Meal.findById(meal)
    .populate({
      path: "restaurant",
      select: "title owner",
    })
    .populate({ path: "category", select: "title" });
  if (!foundMeal) {
    return next(new ApiErrors(req.__("meal_not_found"), 404));
  }

  return res.status(200).json(new ApiSuccess(req.__("meal_found"), foundMeal));
});

/**
 * @desc Get random meals
 * @route GET /api/v1/meal/random
 * @access public
 */
const getRandomMeals = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.query;
  const size = +req.query.size || 5;

  /** @paginate */
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;

  /** @sorting */
  const sort = req.query.sort || "-createdAt";

  let meals;
  let message;
  meals = await Meal.aggregate([
    {
      $match: {
        "coords.latitude": { $eq: +latitude },
        "coords.longitude": { $eq: +longitude },
        isAvailable: true,
      },
    },
    { $sample: { size: size } },
  ])
    .skip(skip)
    .limit(limit)
    .sort(sort);

  if (meals.length === 0) {
    message = req.__("meals_not_found_location");
    meals = await Meal.aggregate([
      { $match: { isAvailable: true } },
      { $sample: { size: size } },
    ])
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  if (!meals) {
    return next(new ApiErrors(req.__("meal_not_found"), 404));
  }
  return res
    .status(200)
    .json(new ApiSuccess(req.__("meals"), { page, message, meals }));
});

/**
 * @desc Add meal rating
 * @route PATCH /api/v1/meal/:id
 * @access protected
 */
const addMealRating = asyncHandler(async (req, res, next) => {
  /**@user */
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  /**@meal */
  const meal = req.params.id;
  const foundMeal = await Meal.findById(meal);
  if (!foundMeal) {
    return next(new ApiErrors(req.__("meal_not_found"), 404));
  }

  const ratedUser = await Rating.findOne({
    user,
    product: foundMeal._id,
  });

  if (ratedUser) {
    return next(new ApiErrors(req.__("already_rated_meal"), 400));
  }

  const { userRating } = req.body;

  const ratingCount = +foundMeal.ratingCount + 1;
  let rating =
    (+foundMeal.rating * +foundMeal.ratingCount + userRating) / ratingCount;
  console.log(rating);
  rating = parseFloat(rating.toFixed(3));

  foundMeal.rating = +rating;
  foundMeal.ratingCount = +ratingCount;

  await foundMeal.save();

  const ratedMeal = await Rating.create({
    user,
    ratingType: "Meal",
    product: foundMeal._id,
  });

  if (!ratedMeal) {
    return next(new ApiErrors(req.__("rate_meal_failed"), 400));
  }
  return res
    .status(200)
    .json(new ApiSuccess(req.__("rate_meal_success"), ratedMeal));
});

/**
 * @desc Delete a specific meal
 * @route DELETE /api/v1/meal/:id
 * @access protected
 */
const deleteSpecificMeal = asyncHandler(async (req, res, next) => {
  const meal = req.params.id;
  const foundMeal = await Meal.findById(meal);
});

module.exports = {
  addMeal,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
  addMealRating,
};

const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const ApiErrors = require("../utils/api-errors");
const Restaurant = require("../models/Restaurant");
const Meal = require("../models/Meals");
const ApiSuccess = require("../utils/api-success");

/**
 * @desc Add new meal
 * @route POST /api/v1/meal/
 * @access protected
 */
const addMeal = asyncHandler(async (req, res, next) => {
  const {
    title,
    time,
    category,
    coords,
    restaurant,
    description,
    price,
    additives,
  } = req.body;
  const images = req.images;
  const foodType = req.foodType;
  const foodTags = req.foodTags;
  /** @category */
  const foundCategory = await Category.findById(category);
  if (!foundCategory) {
    return next(
      new ApiErrors(`This category not found with this id: ${category}`, 404)
    );
  }

  /** @restaurant */
  const foundRestaurant = await Restaurant.findById(restaurant);
  if (!foundRestaurant) {
    return next(
      new ApiErrors(
        `This restaurant not found with this id: ${restaurant}`,
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
    additives: JSON.parse(additives),
    images,
  });

  if (!newMeal) {
    return next(new ApiErrors("Failed with creating meal", 400));
  }

  foundRestaurant.foods = newMeal._id;
  foundRestaurant.save();

  return res
    .status(201)
    .json(new ApiSuccess("New meal has been added", newMeal));
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
    return next(new ApiErrors("This category is not found", 404));
  }

  /** @meals */
  const meals = await Meal.aggregate([
    { $match: { category: category } },
    { $sample: { size: 5 } },
  ]);

  if (!meals) {
    return next(new ApiErrors("No meals found for this category", 404));
  }

  return res
    .status(200)
    .json(new ApiSuccess(`Meals for this ${foundCategory.title}`, meals));
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
    return next(new ApiErrors("No restaurant found for this id", 404));
  }
  /** @meals */
  const meals = await Meal.aggregate([
    { $match: { restaurant: foundRestaurant._id } },
    { $sample: { size: 5 } },
  ]);

  if (!meals) {
    return next(new ApiErrors("No meals found for this category", 404));
  }

  return res
    .status(200)
    .json(new ApiSuccess(`Meals for this ${foundRestaurant.title}`, meals));
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
    return next(new ApiErrors("No meal found", 404));
  }

  return res.status(200).json(new ApiSuccess("Meal found", foundMeal));
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
    message = "No meals found in your location";
    meals = await Meal.aggregate([
      { $match: { isAvailable: true } },
      { $sample: { size: size } },
    ])
      .skip(skip)
      .limit(limit)
      .sort(sort);
  }

  if (!meals) {
    return next(new ApiErrors("No meal found", 404));
  }
  return res
    .status(200)
    .json(new ApiSuccess("Meals", { page, message, meals }));
});

module.exports = {
  addMeal,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
};

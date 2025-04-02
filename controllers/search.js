const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");
const Meal = require("../models/Meals");
const Restaurant = require("../models/Restaurant");

/**
 * @description Global search for categories,restaurants,meals
 * @router GET /api/v1/search/global?key={key}
 * @access public
 */

const globalSearch = asyncHandler(async (req, res, next) => {
  const { key } = req.query;
  const [categories, meals, restaurants] = await Promise.all([
    categorySearch(key),
    mealSearch(key),
    restaurantsSearch(key),
  ]);
  const result = { categories, meals, restaurants };
  return res.status(200).json(result);
});

/**
 * @description Search for categories
 * @route GET /api/v1/search/category?key={key}
 * @access public
 */
const searchCategory = asyncHandler(async (req, res, next) => {
  const { key } = req.query;

  const result = await Promise.resolve(categorySearch(key));
  return res.status(200).json(result);
});

/**
 * @description Search for restaurants
 * @route GET /api/v1/search/restaurant?key={key}
 * @access public
 */
const searchRestaurant = asyncHandler(async (req, res, next) => {
  const { key } = req.query;

  const result = await Promise.resolve(restaurantsSearch(key));
  return res.status(200).json(result);
});

/**
 * @description Search for meals
 * @route GET /api/v1/search/meals?key={key}
 * @access public
 */
const searchMeals = asyncHandler(async (req, res, next) => {
  const { key } = req.query;

  const result = await Promise.resolve(mealSearch(key));
  return res.status(200).json(result);
});

module.exports = {
  globalSearch,
  searchCategory,
  searchRestaurant,
  searchMeals,
};

/**
 * @description Search for categories
 */
async function categorySearch(key) {
  return Category.find({
    $or: [
      { "title.en": { $regex: `^${key}`, $options: "i" } },
      { "title.ar": { $regex: `^${key}`, $options: "i" } },
      { value: { $regex: `^${key}`, $options: "i" } },
      { slug: key.toLowerCase() },
    ],
  }).select("title icon");
}

/**
 * @description Search for meals
 */
async function mealSearch(key) {
  return Meal.find({
    $or: [
      { "title.en": { $regex: `^${key}`, $options: "i" } },
      { "title.ar": { $regex: `^${key}`, $options: "i" } },
      { "foodTags.en": { $regex: `^${key}`, $options: "i" } },
      { "foodTags.ar": { $regex: `^${key}`, $options: "i" } },
      { "foodType.en": { $regex: `^${key}`, $options: "i" } },
      { "foodType.ar": { $regex: `^${key}`, $options: "i" } },
    ],
  }).select("title rating images isNewMeal isOffer");
}

/**
 * @description Search for restaurants
 */

async function restaurantsSearch(key) {
  return Restaurant.find({
    $or: [
      { "title.en": { $regex: `^${key}`, $options: "i" } },
      { "title.ar": { $regex: `^${key}`, $options: "i" } },
    ],
  }).select("title cover logo rating");
}

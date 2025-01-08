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
const { json } = require("express");

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
    foodTags,
    foodType,
    images,
  } = req.body;

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

  foundRestaurant.foods.push(newMeal._id);
  foundRestaurant.save();

  return res.status(201).json(newMeal);
});

const addMealImages = asyncHandler(async (req, res, next) => {
  const { mealId } = req.body;
  const foundMeal = await Meal.findById(mealId);
  if (!foundMeal) {
    return next(new ApiErrors("Meal not found"), 404);
  }

  const uploadImages = req.files.map((image, index) => {
    const folder = `Meal/${slugify(foundMeal.title.en).toLowerCase()}`;
    const prefix = `meal-${index}`;
    return uploadImage(image, folder, prefix);
  });
  const images = await Promise.all(uploadImages);

  foundMeal.images.push(images);
  await foundMeal.save();
  return res.status(200).json({ message: "Images add successfully." });
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
  const meals = await Meal.find({ category: foundCategory._id })
    .populate({
      path: "restaurant",
      select: "title logo",
    })
    .select("title price images time rating  priceWithoutDiscount isNew");

  if (!meals) {
    return next(new ApiErrors(req.__("category_meals_not_found"), 404));
  }

  return res.status(200).json(meals);
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
    {
      $project: {
        title: 1,
        time: 1,
        images: 1,
        rating: 1,
        price: 1,
        _id: 1,
      },
    },
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

  return res.status(200).json(foundMeal);
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
  const sort = req.query.sort || { createdAt: -1 };

  let meals;
  let message;
  meals = await Meal.aggregate([
    {
      $match: {
        "coords.latitude": { $eq: latitude },
        "coords.longitude": { $eq: longitude },
        isAvailable: true,
      },
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    { $sample: { size: size } },

    {
      $lookup: {
        from: "restaurants",
        localField: "restaurant",
        foreignField: "_id",
        pipeline: [{ $project: { title: 1, logo: 1, _id: 1 } }],
        as: "restaurant",
      },
    },
    { $unwind: "$restaurant" },
    {
      $project: {
        _id: 1,
        title: 1,
        time: 1,
        rating: 1,
        price: 1,
        isNew: 1,
        images: 1,
        priceWithoutDiscount: 1,
        "restaurant.logo": 1,
        "restaurant.title": 1,
      },
    },
  ]);

  if (meals.length === 0) {
    message = req.__("meals_not_found_location");
    meals = await Meal.aggregate([
      { $match: { isAvailable: true } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $sample: { size: size } },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant",
          foreignField: "_id",
          pipeline: [{ $project: { title: 1, logo: 1, _id: 0 } }],
          as: "restaurant",
        },
      },
      { $unwind: "$restaurant" },
      {
        $project: {
          _id: 1,
          title: 1,
          time: 1,
          rating: 1,
          price: 1,
          isNew: 1,
          images: 1,
          priceWithoutDiscount: 1,
          "restaurant.logo": 1,
          "restaurant.title": 1,
        },
      },
    ]);
  }

  if (!meals) {
    return next(new ApiErrors(req.__("meal_not_found"), 404));
  }
  return res.status(200).json({ page, meals });
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

  const { userRating, review, reviewImages } = req.body;

  const ratingCount = +foundMeal.ratingCount + 1;
  let rating =
    (+foundMeal.rating * +foundMeal.ratingCount + userRating) / ratingCount;

  rating = parseFloat(rating.toFixed(2));

  const ratedMeal = await Rating.create({
    user,
    ratingType: "Meal",
    product: foundMeal._id,
    rating: userRating,
    review,
    reviewImages,
  });

  foundMeal.rating = +rating;
  foundMeal.ratingCount = +ratingCount;
  foundMeal.reviews.push(ratedMeal._id);
  await foundMeal.save();

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
  addMealImages,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
  addMealRating,
};

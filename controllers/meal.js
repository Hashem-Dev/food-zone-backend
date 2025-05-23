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
 * @description Add new meal
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

  return res.status(201).json({ message: "Meal created successfully" });
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
 * @description Get meals that's belong to specific category
 * @route GET /api/v1/meal/:category
 * @access public
 */
const categoryMeals = asyncHandler(async (req, res, next) => {
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
    .select("title price images time rating  priceWithoutDiscount isNewMeal");

  if (!meals) {
    return next(new ApiErrors(req.__("category_meals_not_found"), 404));
  }

  return res.status(200).json(meals);
});

/**
 * @description Get meals that's belong to specific restaurant
 * @route GET /api/v1/meal/restaurant/:restaurant
 * @access public
 */
const restaurantMeals = asyncHandler(async (req, res, next) => {
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
        priceWithoutDiscount: 1,
        isNewMeal: 1,
        _id: 1,
      },
    },
  ]);

  if (!meals) {
    return next(new ApiErrors(req.__("category_meals_not_found"), 404));
  }

  return res.status(200).json(meals);
});

/**
 * @description Get a specific meal
 * @route GET /api/v1/meal/:id
 * @access public
 */
const specificMeal = asyncHandler(async (req, res, next) => {
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
 * @description Get random meals
 * @route GET /api/v1/meal/random
 * @access public
 */
const randomMeals = asyncHandler(async (req, res, next) => {
  const { latitude, longitude } = req.query;
  const size = +req.query.size || 5;
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  const sort = { createdAt: -1 };

  try {
    let meals = await Meal.aggregate([
      { $match: { isAvailable: true } },
      { $sort: sort },
      { $limit: limit },
      { $sample: { size: size } },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant",
          foreignField: "_id",
          pipeline: [{ $project: { title: 1, logo: 1 } }],
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
          isNewMeal: 1,
          images: 1,
          priceWithoutDiscount: 1,
          "restaurant.logo": 1,
          "restaurant.title": 1,
        },
      },
    ]);

    if (!meals.length) {
      return next(new ApiErrors(req.__("meal_not_found"), 404));
    }

    return res.status(200).json({ page, meals });
  } catch (error) {
    return next(new ApiErrors(error.message, 500));
  }
});

/**
 * @description Add meal rating
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
    meal: foundMeal._id,
  });

  if (ratedUser) {
    return next(new ApiErrors(req.__("already_rated_meal"), 400));
  }

  const { userRating, review, reviewImages } = req.body;

  const isPositive = userRating >= 4;

  const ratingCount = +foundMeal.ratingCount + 1;
  let rating =
    (+foundMeal.rating * +foundMeal.ratingCount + userRating) / ratingCount;

  rating = parseFloat(rating.toFixed(2));

  const ratedMeal = await Rating.create({
    user,
    ratingType: "Meal",
    mealId: foundMeal._id,
    rating: userRating,
    review,
    reviewImages,
    isPositive,
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
 * @description Delete a specific meal
 * @route DELETE /api/v1/meal/:id
 * @access protected
 */
const deleteSpecificMeal = asyncHandler(async (req, res, next) => {
  const meal = req.params.id;
  const foundMeal = await Meal.findById(meal);
});

/**
 * @description Add meal to user favorite
 * @route PATCH /api/v1/meal/favorite/
 * @access protected
 */
const addMealToFavorite = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { mealId } = req.params;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found.", 404));
  }

  const foundMeal = await Meal.findById(mealId);
  if (!foundMeal) {
    return next(new ApiErrors("Meal not found", 404));
  }

  const favoriteMeals = foundUser.favoriteMeals.some((meal) => {
    if (meal.meals.toString() === mealId) {
      return true;
    }
  });

  if (!favoriteMeals) {
    const newFavorite = { meals: mealId, isAdded: true };
    foundUser.favoriteMeals.push(newFavorite);
    await foundUser.save();
    return res.status(200).json(foundUser);
  } else {
    const filteredMeals = foundUser.favoriteMeals.filter(
      (meal) => meal.meals.toString() !== mealId
    );
    foundUser.favoriteMeals = filteredMeals;
    await foundUser.save();
    return res.status(200).json(foundUser);
  }
});

/**
 * @description Get all favorite meals
 * @route GET /api/v1/meals/favorite
 * @access protected
 */
const allFavoriteMeals = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  const favoriteMeals = foundUser.favoriteMeals.map((meal) =>
    meal.meals.toString()
  );
  return res.status(200).json(favoriteMeals);
});

/**
 * @description Get all meals offer available
 * @route GET /api/v1/meals/offers
 * @access public
 */
const mealsOffer = asyncHandler(async (req, res, next) => {
  const { limit, size } = req.query;
  const offers = await Meal.find({ isOffer: true })
    .limit(limit)
    .select(
      "price priceWithoutDiscount isOffer title rating ratingCount images "
    );
  if (!offers) {
    return next(new ApiErrors("Meals offer not found", 404));
  }
  return res.status(200).json(offers);
});

module.exports = {
  addMeal,
  addMealImages,
  mealsOffer,
  categoryMeals,
  restaurantMeals,
  specificMeal,
  randomMeals,
  addMealRating,
  addMealToFavorite,
  allFavoriteMeals,
};

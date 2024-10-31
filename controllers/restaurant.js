const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rating = require("../models/Rating");

const ApiErrors = require("../utils/api-errors");
const ApiSuccess = require("../utils/api-success");
const ApiFeatures = require("../utils/api-features");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * @desc Create new vendor restaurant
 * @route POST /api/v1/restaurant/
 * @access protected
 */
const addRestaurant = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }

  const { title, time, coords } = req.body;
  const cover = req.files.cover[0].filename;
  const logo = req.files.logo[0].filename;

  const newRestaurant = await Restaurant.create({
    owner: user,
    title,
    time,
    cover,
    logo,
    coords,
  });

  if (!newRestaurant) {
    return next(new ApiErrors("Failed with create the restaurant", 400));
  }

  return res
    .status(201)
    .json(new ApiSuccess("Restaurant created successfully", newRestaurant));
});

/**
 * @desc Get all restaurant belong to the specific vendor
 * @route GET /api/v1/restaurant
 * @access protected
 */
const getRestaurantVendor = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }

  const apiFeature = new ApiFeatures(
    Restaurant.find({ owner: user }),
    req.query
  ).sort();

  const { mongooseQuery } = apiFeature;
  const vendorRestaurants = await mongooseQuery.populate({
    path: "owner",
    select: "name",
  });

  if (!vendorRestaurants) {
    return next(new ApiErrors("No restaurants found", 404));
  }
  return res
    .status(200)
    .json(new ApiSuccess("All restaurants", vendorRestaurants));
});

/**
 * @desc Get a specific restaurant
 * @route GET /api/v1/restaurant/:id
 * @access protected
 */
const getRestaurantById = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const restaurant = req.params.id;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }

  const foundRestaurant = await Restaurant.findById(restaurant);
  if (!foundRestaurant) {
    return next(new ApiErrors("This restaurant not found", 404));
  }
  return res.status(200).json(new ApiSuccess("Restaurant", foundRestaurant));
});

/**
 * @desc Get nearby random restaurant
 * @route GET /api/v1/restaurant/:lang/:lat
 * @access protected
 */
const getRandomNearByRestaurants = asyncHandler(async (req, res, next) => {
  const { longitude, latitude } = req.query;
  const user = req.user;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  let randomRestaurants;
  let message;

  randomRestaurants = await Restaurant.find({
    "coords.latitude": latitude,
    "coords.longitude": longitude,
    verification: "Verified",
    isAvailable: true,
  }).limit(5);

  if (randomRestaurants.length === 0) {
    message = "No restaurants found in your location";
    randomRestaurants = await Restaurant.find({
      verification: "Verified",
      isAvailable: true,
    }).limit(5);
  }

  if (!randomRestaurants) {
    return next(new ApiErrors("No restaurant found", 404));
  }

  res
    .status(200)
    .json(new ApiSuccess(message, shuffleArray(randomRestaurants)));
});

/**
 * @desc Get all nearby restaurants
 * @route GET /api/v1/restaurant/all
 * @access protected
 */
const allNearbyRestaurants = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("No user found", 404));
  }
  /** @pagination */
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const skip = (page - 1) * limit;
  const { longitude, latitude } = req.query;

  /** @filtering */
  const queryString = { ...req.query };
  const excludedParams = [
    "page",
    "sort",
    "limit",
    "fields",
    "longitude",
    "latitude",
  ];
  excludedParams.forEach((field) => delete queryString[field]);

  let filterString = JSON.stringify(queryString);
  filterString = filterString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );
  const filters = JSON.parse(filterString);

  let randomRestaurants;
  let message;
  randomRestaurants = await Restaurant.find({
    "coords.latitude": latitude,
    "coords.longitude": longitude,
    verification: "Verified",
    isAvailable: true,
    ...filters,
  })
    .skip(skip)
    .limit(limit);

  if (randomRestaurants.length === 0) {
    message = "No restaurants found in your location";
    randomRestaurants = await Restaurant.find({
      verification: "Verified",
      isAvailable: true,
      ...filters,
    })
      .skip(skip)
      .limit(limit);
  }

  return res
    .status(200)
    .json({ message, restaurants: shuffleArray(randomRestaurants) });
});

/**
 * @desc Rating a specific restaurant
 * @route PATCH /api/v1/restaurant/:id
 * @access protected
 */
const addRestaurantRating = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const restaurantId = req.params.id;
  const { userRating } = req.body;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }

  if (foundUser.role === "vendor") {
    return next(
      new ApiErrors("Vendors not allowed to use this rating feature.", 403)
    );
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new ApiErrors("This restaurant not found", 404));
  }

  const ratedRestaurant = await Rating.findOne({
    user,
    product: restaurant._id,
  });

  if (ratedRestaurant) {
    return res
      .status(200)
      .json(
        new ApiSuccess(
          "You already rate this restaurant",
          ratedRestaurant.rating
        )
      );
  }

  const ratingCount = +restaurant.ratingCount + 1;

  let rating =
    (+restaurant.rating * +restaurant.ratingCount + userRating) / ratingCount;
  console.log(rating);

  rating = parseFloat(rating.toFixed(3));

  restaurant.rating = +rating;
  restaurant.ratingCount = +ratingCount;
  await restaurant.save();

  const newRating = await Rating.create({
    user: user,
    ratingType: "Restaurant",
    product: restaurant._id,
    rating: userRating,
  });

  if (!newRating) {
    return next(new ApiErrors("Failed to rate this restaurant", 400));
  }

  return res.status(200).json({ newRating });
});

module.exports = {
  addRestaurant,
  getRestaurantVendor,
  getRestaurantById,
  getRandomNearByRestaurants,
  allNearbyRestaurants,
  addRestaurantRating,
};

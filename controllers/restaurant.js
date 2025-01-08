const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rating = require("../models/Rating");

const ApiErrors = require("../utils/api-errors");
const ApiSuccess = require("../utils/api-success");
const ApiFeatures = require("../utils/api-features");
const { uploadImage } = require("../services/uploader/cloudinary");

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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  if (!req.files.cover || !req.files.logo) {
    return next(new ApiErrors(req.__("restaurant_image_required"), 400));
  }

  const { title, time, coords } = req.body;
  const cover = await uploadImage(
    req.files.cover[0],
    "Restaurant/covers",
    "cover"
  );
  const logo = await uploadImage(req.files.logo[0], "Restaurant/logos", "logo");

  const newRestaurant = await Restaurant.create({
    owner: user,
    title,
    time,
    cover: cover.url,
    logo: logo.url,
    coords,
  });

  if (!newRestaurant) {
    return next(new ApiErrors(req.__("create_restaurant_failed"), 400));
  }

  return res
    .status(201)
    .json(new ApiSuccess(req.__("create_restaurant_success"), newRestaurant));
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
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
    return next(new ApiErrors(req.__("no_restaurants_found"), 404));
  }
  return res
    .status(200)
    .json(new ApiSuccess(req.__("all_restaurants"), vendorRestaurants));
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  const foundRestaurant = await Restaurant.findById(restaurant);
  if (!foundRestaurant) {
    return next(new ApiErrors(req.__("restaurant_not_found"), 404));
  }
  return res
    .status(200)
    .json(new ApiSuccess(req.__("restaurant"), foundRestaurant));
});

/**
 * @desc Get nearby random restaurant
 * @route GET /api/v1/restaurant/:lang/:lat
 * @access protected
 */
const getRandomNearByRestaurants = asyncHandler(async (req, res, next) => {
  const { longitude, latitude } = req.query;
  const user = req.user;
  const size = +req.query.size || 5;

  /** @paginate */
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;

  /** @sorting */
  const sort = req.query.sort || { createdAt: -1 };
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  let randomRestaurants;
  let message;

  randomRestaurants = await Restaurant.aggregate([
    {
      $match: {
        "coords.latitude": { $eq: latitude },
        "coords.longitude": { $eq: longitude },
        verification: "Verified",
        isAvailable: true,
      },
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    { $sample: { size: size } },
  ]);

  if (randomRestaurants.length === 0) {
    message = req.__("no_restaurant_in_location");
    randomRestaurants = await Restaurant.aggregate([
      {
        $match: {
          isAvailable: true,
          verification: "Verified",
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $sample: { size: size } },
    ]);
  }

  if (!randomRestaurants) {
    return next(new ApiErrors(req.__("no_restaurants_found"), 404));
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
    return next(new ApiErrors(req.__("user_not_found"), 404));
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
    message = req.__("no_restaurant_in_location");
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
  const { userRating, review, reviewImages } = req.body;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  if (foundUser.role === "vendor") {
    return next(new ApiErrors(req.__("no_rating_for_vendor"), 403));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return next(new ApiErrors(req.__("restaurant_not_found"), 404));
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
          req.__("already_rate_restaurant"),
          ratedRestaurant.rating
        )
      );
  }

  const ratingCount = +restaurant.ratingCount + 1;

  let rating =
    (+restaurant.rating * +restaurant.ratingCount + userRating) / ratingCount;

  rating = parseFloat(rating.toFixed(2));

  const newRating = await Rating.create({
    user: user,
    ratingType: "Restaurant",
    product: restaurant._id,
    rating: userRating,
    review,
    reviewImages,
  });

  restaurant.rating = +rating;
  restaurant.ratingCount = +ratingCount;
  restaurant.reviews.push(newRating._id);

  await restaurant.save();

  if (!newRating) {
    return next(new ApiErrors(req.__("rate_restaurant_failed"), 400));
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

const asyncHandler = require("express-async-handler");
const Rating = require("../models/Rating");
const ApiErrors = require("../utils/api-errors");
const { default: mongoose } = require("mongoose");

/**
 * @description Get all reviews for specific product
 * @route GET /api/v1/reviews/product
 * @access Protected
 */
const getReviewsForProduct = asyncHandler(async (req, res, next) => {
  const { product, productId, rating, isPositive, page, limit } = req.query;

  const skip = (Number(page || 1) - 1) * Number(limit == null ? 10 : limit);

  let reviews;
  const filter = {};
  if (rating) {
    const numericRating = Number(rating);
    filter.rating = { $gte: numericRating, $lt: numericRating + 1 };
  }
  if (isPositive) filter.isPositive = isPositive === "true";

  if (product == "meal") {
    filter.ratingType = "Meal";
    if (productId) filter.mealId = productId;
  } else if (product == "restaurant") {
    filter.ratingType = "Restaurant";
    if (productId) filter.restaurantId = productId;
  }
  reviews = await Rating.find(filter)
    .skip(skip)
    .limit(limit)
    .populate({
      path: "user",
      select: "avatar name _id",
    })

    .sort({ rating: -1 })
    .sort({ createdAt: -1 })
    .select("-reviewImages -updatedAt -__v -mealId");
  if (!reviews) {
    return next(new ApiErrors("No rating found for this meal.", 404));
  }

  return res.status(200).json(reviews);
});

const productReviewsDetails = asyncHandler(async (req, res, next) => {
  const { productId, productType } = req.query;

  if (!productId || !productType) {
    return res
      .status(400)
      .json({ message: "productId and productType are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid productId" });
  }

  let matchFilter = {};
  if (productType === "meal") {
    matchFilter.mealId = new mongoose.Types.ObjectId(productId);
    matchFilter.ratingType = "Meal";
  } else if (productType == "restaurant") {
    matchFilter.restaurantId = new mongoose.Types.ObjectId(productId);
    matchFilter.ratingType = "Restaurant";
  }

  const ratings = await Rating.aggregate([
    { $match: { ...matchFilter, rating: { $exists: true, $type: "number" } } },
    { $project: { ratingRange: { $ceil: "$rating" } } },
    { $group: { _id: "$ratingRange", count: { $sum: 1 } } },
  ]);

  const totalReviews =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.count, 0)
      : 0;

  const result = Array.from({ length: 5 }, (_, i) => {
    const ratingValue = i + 1;
    const ratingData = ratings.find(
      (r) => Math.round(Number(r._id)) === ratingValue
    ) || { count: 0 };

    return {
      rating: ratingValue,
      count: ratingData.count,
      percentage:
        totalReviews > 0
          ? ((ratingData.count / totalReviews) * 100).toFixed(2)
          : "0",
    };
  });

  return res.status(200).json({ totalReviews, ratings: result });
});

module.exports = {
  getReviewsForProduct,
  productReviewsDetails,
};

const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const ApiErrors = require("../../utils/api-errors");
const Restaurant = require("../../models/Restaurant");
const ApiSuccess = require("../../utils/api-success");

/**
 * @desc Accept or reject vendor restaurant
 * @route PATCH /api/v1/admin/restaurant/:restaurant
 * @access protected
 */
const verifyVendorRestaurant = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const restaurant = req.params.restaurant;
  const { verification } = req.body;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  let enMessage;
  let arMessage;
  let successMessage;

  if (verification === "Verified") {
    enMessage = "You restaurant is verified now, check it now.";
    arMessage = "تم الموافقة على مطعمك، يمكنك التحقق منه الآن";
    successMessage = "The restaurant is verified";
  } else if (verification === "Rejected") {
    enMessage = "Your restaurant is rejected.";
    arMessage = "لقد تم رفض مطعمك، لعدم توافقه مع سياسية الخصوصية لدينا";
    successMessage = "The restaurant is rejected";
  } else {
    return next(new ApiErrors("You have to provide verification status"));
  }

  const updatedRestaurant = await Restaurant.findByIdAndUpdate(
    { _id: restaurant },
    {
      $set: {
        verification: verification,
        verificationMessage: { en: enMessage, ar: arMessage },
      },
    },
    { new: true }
  );
  if (!updatedRestaurant) {
    return next(new ApiErrors("Restaurant not found", 404));
  }
  return res.status(200).json(new ApiSuccess(successMessage));
});

/**
 * @desc Get all restaurant
 * @route GET /api/v1/admin/restaurant
 * @access protected
 */
const getAllRestaurants = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found"));
  }
  /** @paginate */
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 5;
  const skip = (page - 1) * limit;

  /** @filter */
  const queryString = { ...req.query };
  const excludedParams = ["page", "sort", "limit", "fields"];
  excludedParams.forEach((field) => delete queryString[field]);

  let filterString = JSON.stringify(queryString);
  filterString = filterString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );
  const filter = JSON.parse(filterString);

  /** @selection */
  const fieldsQuery = req.query.fields
    ? req.query.fields.split(",").join(" ")
    : "";

  const allRestaurants = await Restaurant.find(filter)
    .skip(skip)
    .limit(limit)
    .select(fieldsQuery)
    .sort("-createdAt -verification");

  if (!allRestaurants) {
    return next(new ApiErrors("No restaurants found", 404));
  }
  return res.status(200).json(new ApiSuccess("Restaurants", allRestaurants));
});
module.exports = { verifyVendorRestaurant, getAllRestaurants };

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");
const Address = require("../models/Address");
const ApiFeatures = require("../utils/api-features");
const ApiSuccess = require("../utils/api-success");

/**
 * @desc Add new address for user
 * @route POST /api/v1/address/
 * @access protected
 */
const addAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  const {
    country,
    city,
    street,
    apartment,
    location,
    additionalInfo,
    addressTitle,
  } = req.body;

  /**
   *
   * Check is address added or not by lat & lon
   *
   *
   *
   */

  const newAddress = new Address({
    user,
    country,
    city,
    street,
    apartment,
    location,
    additionalInfo,
    addressTitle,
  });
  await newAddress.save();
  foundUser.addresses.push(newAddress._id);
  foundUser.save();

  if (!newAddress) {
    return next(new ApiErrors(req.__("new_address_failed"), 400));
  }

  return res.status(201).json(newAddress);
});

/**
 * @desc Get user addresses
 * @route GET /api/v1/address/
 * @access protected
 */
const getAllAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  const countDocument = await Address.countDocuments();
  const features = new ApiFeatures(
    Address.find({ user: user }).select("-updatedAt -__v"),
    req.query
  );
  features.paginate(countDocument).sort();

  const { paginationResults, mongooseQuery } = features;
  const result = await mongooseQuery;

  if (!result) {
    return next(new ApiErrors(req.__("no_address_set"), 404));
  }
  return res.status(200).json({ paginationResults, result });
});

/**
 * @desc Set default address
 * @route PATCH /api/v1/address/:id/default
 * @access protected
 */
const setDefaultAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const addressId = req.params.id;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  const foundAddress = await Address.findById(addressId);
  if (!foundAddress) {
    return next(new ApiErrors(req.__("no_address_in_list"), 404));
  }

  if (foundAddress.defaultAddress) {
    return res
      .status(200)
      .json(new ApiSuccess(req.__("address_already_default")));
  }

  const defaultAddress = await Address.updateMany(
    { user: foundAddress.user, defaultAddress: true },
    { $set: { defaultAddress: false } },
    { new: true }
  );
  if (!defaultAddress) {
    return next(new ApiErrors(req.__("address_default_failed"), 404));
  }
  foundAddress.defaultAddress = true;
  await foundAddress.save();

  return res
    .status(200)
    .json(new ApiSuccess(req.__("address_default_success")));
});

/**
 * @desc Deletes a specific address
 * @router DELETE /api/v1/address/:id
 * @access protected
 */
const deleteAddress = asyncHandler(async (req, res, next) => {
  console.log("ddddddddddddddddddd");
  const user = req.user;
  const { id } = req.params;
  const foundUser = await User.findById(user);

  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  const foundAddress = await Address.findById(id);
  if (!foundAddress) {
    return next(new ApiErrors(req.__("address_not_found"), 404));
  }

  const updateUser = await User.findByIdAndUpdate(
    user,
    { $pull: { addresses: id } },
    { new: true }
  );
  const deletedAddress = await Address.findByIdAndDelete(id);
  if (!updateUser || !deletedAddress) {
    return next(new ApiErrors(req.__("address_delete_failed"), 400));
  }

  return res.status(200).json(new ApiSuccess(req.__("address_delete_success")));
});

/**
 * @desc Update a specific address
 * @route PATCH /api/v1/address/:id
 * @access protected
 */
const updateAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const addressId = req.params.id;
  const { country, city, street, apartment, additionalInfo } = req.body;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    { _id: addressId, user: user },
    { country, city, street, apartment, additionalInfo },
    { new: true }
  );

  if (!updatedAddress) {
    return next(new ApiErrors(req.__("address_update_failed"), 404));
  }
  return res.status(200).json(new ApiSuccess(req.__("address_update_success")));
});

/**
 * @desc Get nearest locations
 * @route /nearest
 * @access protected
 */
const getNearestLocations = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  const { lat, lng } = req.query;
  const addresses = await Address.find({
    user: userId,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: 2000,
      },
    },
  });

  res.status(200).json(addresses);
});

module.exports = {
  addAddress,
  getAllAddress,
  setDefaultAddress,
  deleteAddress,
  getNearestLocations,
  updateAddress,
};

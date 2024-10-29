const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");
const Address = require("../models/Address");
const ApiFeatures = require("../utils/api-features");

/**
 * @desc Add new address for user
 * @route POST /api/v1/address/
 * @access protected
 */
const addAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  const { country, city, street, apartment, location, additionalInfo } =
    req.body;

  if (!location || !location.coordinates || location.coordinates.length !== 2) {
    return res.status(400).json({
      error: "Coordinates are required and must contain [longitude, latitude]",
    });
  }
  const newAddress = new Address({
    user,
    country,
    city,
    street,
    apartment,
    location,
    additionalInfo,
  });
  await newAddress.save();
  foundUser.addresses = newAddress._id;
  foundUser.save();

  if (!newAddress) {
    return next(new ApiErrors("Failed with add new address", 400));
  }
  return res.status(201).json({
    status: "Success",
    address: newAddress,
    message: "New address add to your list",
  });
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
    return next(new ApiErrors("User not found", 404));
  }
  const countDocument = await Address.countDocuments();
  const features = new ApiFeatures(Address.find({ user }), req.query);
  features.paginate(countDocument).sort();

  const { paginationResults, mongooseQuery } = features;
  const result = await mongooseQuery;

  if (!result) {
    return next(new ApiErrors("You do not have any address yet", 404));
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
    return next(new ApiErrors("User not found", 404));
  }

  const foundAddress = await Address.findById(addressId);
  if (!foundAddress) {
    return next(new ApiErrors("This address not in your addresses list", 404));
  }

  const defaultAddress = await Address.updateMany(
    { user: foundAddress.user, defaultAddress: true },
    { $set: { defaultAddress: false } },
    { new: true }
  );
  if (!defaultAddress) {
    return next(new ApiErrors("Failed to set default address", 404));
  }
  foundAddress.defaultAddress = true;
  await foundAddress.save();

  return res.status(200).json({
    status: "Success",
    message: "This address set as default location",
    foundAddress,
  });
});

/**
 * @desc Deletes a specific address
 * @router DELETE /api/v1/address/:id
 * @access protected
 */
const deleteAddress = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const addressId = req.params.id;
  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors("User not found", 404));
  }
  const foundAddress = await Address.findById(addressId);
  if (!foundAddress) {
    return next(new ApiErrors("This address not found", 404));
  }

  const updateUser = await User.findByIdAndUpdate(
    user,
    { $pull: { addresses: addressId } },
    { new: true }
  );
  const deletedAddress = await Address.findByIdAndDelete(addressId);
  if (!updateUser || !deletedAddress) {
    return next(new ApiErrors("Failed to update address", 400));
  }

  return res.status(200).json({ updateUser });
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
    return next(new ApiErrors("User not found", 404));
  }
  const updatedAddress = await Address.findByIdAndUpdate(
    { _id: addressId, user: user },
    { country, city, street, apartment, additionalInfo },
    { new: true }
  );
  if (!updatedAddress) {
    return next(new ApiErrors("Failed with update this address", 404));
  }
  return res
    .status(200)
    .json({ status: "Success", message: "Address updated successfully" });
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

const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const ApiErrors = require("../../utils/api-errors");
const ApiFeatures = require("../../utils/api-features");

/**
 * @desc Get all users
 * @route GET /api/v1/admin/users/
 * @access protected
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const countDocument = await User.countDocuments();
  const apiFeatures = new ApiFeatures(User.find(), req.query)
    .paginate(countDocument)
    .sort()
    .customSelect();
  const { paginationResults, mongooseQuery } = apiFeatures;
  const allUsers = await mongooseQuery.populate({
    path: "addresses",
    select: "country city -_id",
  });

  if (!allUsers) {
    return next(new ApiErrors("Users not found", 404));
  }
  return res.status(200).json({ paginationResults, users: allUsers });
});

/**
 * @desc Delete a specific user
 * @route DELETE /api/v1/admin/users/:id
 * @access protected
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  console.log(id);

  const user = await User.findById(id);
  if (!user) {
    return next(new ApiErrors("This user is not exist", 404));
  }
  if (user.isAdmin) {
    return next(
      new ApiErrors("You are not allowed to delete admin account", 403)
    );
  }
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    return next(new ApiErrors("Failed to delete this user with ID:" + id, 400));
  }

  return res.status(204).end();
});

module.exports = {
  getAllUsers,
  deleteUser,
};

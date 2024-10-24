const asyncHandler = async function (controller, next) {
  try {
    return await controller();
  } catch (error) {
    next(new ApiErrors(error.message, error.statusCode));
  }
};

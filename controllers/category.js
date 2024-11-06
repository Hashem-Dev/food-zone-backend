const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const User = require("../models/User");
const Category = require("../models/Category");
const ApiError = require("../utils/api-errors");
const ApiSuccess = require("../utils/api-success");
const { uploadImage } = require("../services/uploader/cloudinary");

/**
 * @desc Create category
 * @route POST /api/v1/category/
 * @access protected
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const titleEn = req.body.title.en;
  const titleAr = req.body.title.ar;
  const slug = slugify(titleEn);
  const value = titleEn;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiError(req.__("user_not_found"), 404));
  }
  const categoryIcon = await uploadImage(req.file, "Category", "category");
  const icon = categoryIcon.url;
  const newCategory = await Category.create({
    title: { en: titleEn, ar: titleAr },
    value,
    slug,
    icon,
  });

  if (!newCategory) {
    return next(new ApiError(req.__("create_category_failed"), 400));
  }

  return res
    .status(201)
    .json(new ApiSuccess(req.__("category_create_success"), newCategory));
});

/**
 * @desc Get random category
 * @route GET /api/v1/category/
 * @access public
 */
const getRandomCategory = asyncHandler(async (req, res, next) => {
  const categories = await Category.aggregate([
    { $match: { value: { $ne: "more" } } },
    { $sample: { size: 4 } },
  ]);

  const fixedCategory = await Category.find({ value: "more" });
  if (!categories) {
    return next(new ApiError(req.__("categories_not_found"), 404));
  }
  categories.push(fixedCategory[0]);

  return res.status(200).json(new ApiSuccess("categories", categories));
});

/**
 * @desc Get all categories
 * @route GET /api/v1/category/all
 * @access public
 */
const allCategories = asyncHandler(async (req, res, next) => {
  /** @paginate */
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;

  const categories = await Category.aggregate([
    { $match: { value: { $ne: "more" } } },
  ])
    .skip(skip)
    .limit(limit);

  if (!categories) {
    return next(new ApiError(req.__("categories_not_found"), 404));
  }
  return res.status(200).json(new ApiSuccess("Categories", categories));
});

/**
 * @desc Update a specific category
 * @route PATCH /api/v1/category/:id
 * @access protected
 */
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = req.params.id;
  const titleEn = req.body.title.en;
  const titleAr = req.body.title.ar;

  let value, slug, icon;

  if (req.file) {
    const categoryIcon = await uploadImage(req.file, "Category", "category");
    icon = categoryIcon.url;
  }
  if (titleEn) {
    value = titleEn;
    slug = slugify(titleEn);
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    { _id: category },
    { title: { en: titleEn, ar: titleAr }, value, slug, icon },
    { new: true }
  );

  if (!updatedCategory) {
    return next(new ApiError(req.__("category_not_found"), 404));
  }

  return res
    .status(200)
    .json(new ApiSuccess(req.__("category_update_success"), updatedCategory));
});

/**
 * @desc Delete category
 * @route DELETE /api/v1/category/:id
 * @access protected
 */

const deleteCategory = asyncHandler(async (req, res, next) => {});

module.exports = {
  getRandomCategory,
  createCategory,
  allCategories,
  updateCategory,
};

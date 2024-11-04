const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
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
  const { title } = req.body;
  const slug = slugify(title);
  const value = title;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiError("User not found", 404));
  }
  const categoryIcon = await uploadImage(req.file, "Category", "category");
  const icon = categoryIcon.url;
  const newCategory = await Category.create({ title, value, slug, icon });

  if (!newCategory) {
    return next(new ApiError("Failed with create new category", 400));
  }

  return res.status(201).json({ category: newCategory });
});

/**
 * @desc Get random category
 * @route GET /api/v1/category/
 * @access public
 */
const getRandomCategory = asyncHandler(async (req, res, next) => {
  const categories = await Category.aggregate([
    { $match: { title: { $ne: "More" } } },
    { $sample: { size: 4 } },
  ]);

  const fixedCategory = await Category.find({ title: "More" });

  console.log(fixedCategory);

  if (!categories) {
    return next(new ApiError("No categories found", 404));
  }

  categories.push(fixedCategory);

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
    { $match: { title: { $ne: "More" } } },
  ])
    .skip(skip)
    .limit(limit);

  if (!categories) {
    return next(new ApiError("No categories found", 404));
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
  const { title } = req.body;

  let value, slug, icon;

  if (req.file) {
    const categoryIcon = await uploadImage(req.file, "Category", "category");

    icon = categoryIcon.url;
  }
  if (title) {
    value = title;
    slug = slugify(title);
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    { _id: category },
    { title, value, slug, icon },
    { new: true }
  );

  if (!updatedCategory) {
    return next(new ApiError("Category not found", 404));
  }

  return res
    .status(200)
    .json(new ApiSuccess("Category updated successfully", updatedCategory));
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

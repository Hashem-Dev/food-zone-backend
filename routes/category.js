const express = require("express");
const router = express.Router();

const {
  createCategory,
  getRandomCategory,
  allCategories,
  updateCategory,
} = require("../controllers/category");

const {
  verifyToken,
  verifyAdminToken,
} = require("../middlewares/verify-token");
const uploadCategoryIcon = require("../services/uploader/category-icon-uploader");
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require("../services/validators/category");

router
  .route("/")
  .post(
    verifyToken,
    verifyAdminToken,
    uploadCategoryIcon.single("icon"),
    createCategoryValidator,
    createCategory
  )
  .get(getRandomCategory);

router.route("/all").get(allCategories);
router
  .route("/:id")
  .patch(
    verifyToken,
    verifyAdminToken,
    uploadCategoryIcon.single("icon"),
    updateCategoryValidator,
    updateCategory
  );

module.exports = router;

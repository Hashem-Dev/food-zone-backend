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

const {
  createCategoryValidator,
  updateCategoryValidator,
} = require("../services/validators/category");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router
  .route("/")
  .post(
    verifyToken,
    verifyAdminToken,
    upload.single("icon"),
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
    upload.single("icon"),
    updateCategoryValidator,
    updateCategory
  );

module.exports = router;

const express = require("express");
const router = express.Router();
const uploadMealImages = require("../services/uploader/meal-images-uploader");
const { addMealValidation } = require("../services/validators/meal");
const {
  addMeal,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
} = require("../controllers/meal");

const {
  verifyToken,
  verifyAdminToken,
} = require("../middlewares/verify-token");

router
  .route("/")
  .post(
    verifyToken,
    verifyAdminToken,
    uploadMealImages.fields([{ name: "images", maxCount: 5 }]),
    addMealValidation,
    addMeal
  )
  .get(getRandomMeals);

router.route("/category/:category").get(getCategoryMeals);
router.route("/restaurant/:restaurant").get(getRestaurantMeals);

router.route("/:id").get(getSpecificMeal);

module.exports = router;

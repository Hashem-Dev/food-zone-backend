const express = require("express");
const router = express.Router();
const uploadMealImages = require("../services/uploader/meal-images-uploader");
const {
  addMealValidation,
  categoryMealValidator,
  restaurantMealValidator,
  addMealRatingValidator,
  specificMealsValidator,
} = require("../services/validators/meal");
const {
  addMeal,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
  addMealRating,
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

router
  .route("/category/:category")
  .get(categoryMealValidator, getCategoryMeals);

router
  .route("/restaurant/:restaurant")
  .get(restaurantMealValidator, getRestaurantMeals);

router
  .route("/:id")
  .get(specificMealsValidator, getSpecificMeal)
  .patch(verifyToken, addMealRatingValidator, addMealRating);

module.exports = router;

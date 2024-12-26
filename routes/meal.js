const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

/**@routes validation */
const {
  addMealValidation,
  categoryMealValidator,
  restaurantMealValidator,
  addMealRatingValidator,
  specificMealsValidator,
} = require("../services/validators/meal");

/**@endpoints */
const {
  addMeal,
  getCategoryMeals,
  getRestaurantMeals,
  getSpecificMeal,
  getRandomMeals,
  addMealRating,
} = require("../controllers/meal");

/** @token validation  */
const {
  verifyToken,
  verifyAdminToken,
} = require("../middlewares/verify-token");

router
  .route("/")
  .post(upload.array("images", 5), addMealValidation, addMeal)
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

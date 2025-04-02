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
  restaurantMeals,
  specificMeal,
  randomMeals,
  addMealRating,
  addMealImages,
  addMealToFavorite,
  allFavoriteMeals,
  categoryMeals,
  mealsOffer,
} = require("../controllers/meal");

/** @token validation  */
const {
  verifyToken,
  verifyAdminToken,
} = require("../middlewares/verify-token");

router
  .route("/")
  .post(addMeal)
  .patch(
    verifyToken,
    verifyAdminToken,
    upload.array("images", 5),
    addMealImages
  )
  .get(randomMeals);

router.route("/offers").get(mealsOffer);

router.route("/category/:category").get(categoryMealValidator, categoryMeals);

router
  .route("/restaurant/:restaurant")
  .get(restaurantMealValidator, restaurantMeals);

router
  .route("/id/:id")
  .get(specificMealsValidator, specificMeal)
  .patch(verifyToken, addMealRatingValidator, addMealRating);

router.route("/favorite/:mealId").patch(verifyToken, addMealToFavorite);
router.route("/favorite").get(verifyToken, allFavoriteMeals);

module.exports = router;

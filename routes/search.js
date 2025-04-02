const express = require("express");
const {
  globalSearch,
  searchCategory,
  searchRestaurant,
  searchMeals,
} = require("../controllers/search");
const router = express.Router();

router.route("/global").get(globalSearch);
router.route("/category").get(searchCategory);
router.route("/restaurant").get(searchRestaurant);
router.route("/meals").get(searchMeals);
module.exports = router;

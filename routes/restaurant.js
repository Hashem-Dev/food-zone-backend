const express = require("express");
const {
  addRestaurant,
  getRestaurantVendor,
  getRestaurantById,
  getRandomNearByRestaurants,
  allNearbyRestaurants,
  addRestaurantRating,
  addToFavorite,
  getFavoriteRestaurant,
} = require("../controllers/restaurant");
const {
  verifyToken,
  verifyVendorToken,
} = require("../middlewares/verify-token");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  addRestaurantValidator,
  restaurantIdValidator,
  restaurantRatingValidator,
} = require("../services/validators/restaurant");

const router = express.Router();

router
  .route("/")
  .post(
    verifyToken,
    verifyVendorToken,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cover", maxCount: 1 },
    ]),
    addRestaurantValidator,
    addRestaurant
  )
  .get(verifyVendorToken, getRestaurantVendor);

router
  .route("/id/:id")
  .get(restaurantIdValidator, getRestaurantById)
  .patch(verifyToken, restaurantRatingValidator, addRestaurantRating);

router.route("/random").get(getRandomNearByRestaurants);

router.route("/all").get(allNearbyRestaurants);

router.route("/favorite/:restaurantId").patch(verifyToken, addToFavorite);
router.route("/favorite").get(verifyToken, getFavoriteRestaurant);

module.exports = router;

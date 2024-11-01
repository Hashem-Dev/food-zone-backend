const express = require("express");
const {
  addRestaurant,
  getRestaurantVendor,
  getRestaurantById,
  getRandomNearByRestaurants,
  allNearbyRestaurants,
  addRestaurantRating,
} = require("../controllers/restaurant");
const {
  verifyToken,
  verifyVendorToken,
} = require("../middlewares/verify-token");
const upload = require("../services/uploader/restaurant-uploader");
const {
  addRestaurantValidator,
  restaurantIdValidator,
  restaurantRatingValidator,
} = require("../services/validators/restaurant");

const router = express.Router();

router.use(verifyToken);

router
  .route("/")
  .post(
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
  .patch(restaurantRatingValidator, addRestaurantRating);

router.route("/random").get(getRandomNearByRestaurants);
router.route("/all").get(allNearbyRestaurants);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  verifyAdminToken,
  verifyToken,
} = require("../middlewares/verify-token");
const { getAllUsers, deleteUser } = require("../controllers/admin/user");
const {
  verifyVendorRestaurant,
  getAllRestaurants,
} = require("../controllers/admin/restaurant");
const { deleteUserValidator } = require("../services/validators/admin");

router.use(verifyToken, verifyAdminToken);

/** @Users */
router.route("/users").get(getAllUsers);
router.route("/users/:id").delete(deleteUserValidator, deleteUser);

/** @Restaurants */
router.route("/restaurant/:restaurant").patch(verifyVendorRestaurant);
router.route("/restaurant/").get(getAllRestaurants);

module.exports = router;

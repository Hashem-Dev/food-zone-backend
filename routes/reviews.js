const express = require("express");
const {
  getReviewsForProduct,
  productReviewsDetails,
} = require("../controllers/reviews");
const router = express.Router();

router.route("/").get(getReviewsForProduct);
router.route("/product-details").get(productReviewsDetails);

module.exports = router;

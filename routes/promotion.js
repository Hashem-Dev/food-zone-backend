const express = require("express");
const { verifyToken } = require("../middlewares/verify-token");
const {
  applyPromotion,
  specificPromotion,
  allPromotions,
} = require("../controllers/promotion");
const router = express.Router();

router.use(verifyToken);

router.route("/apply-promotion").post(applyPromotion);
router.route("/").get(specificPromotion);
router.route("/all").get(allPromotions);

module.exports = router;

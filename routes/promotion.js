const express = require("express");
const { verifyToken } = require("../middlewares/verify-token");
const {
  applyPromotion,
  specificPromotion,
} = require("../controllers/promotion");
const router = express.Router();

router.use(verifyToken);

router.route("/apply-promotion").post(applyPromotion);
router.route("/").get(specificPromotion);

module.exports = router;

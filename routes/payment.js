const express = require("express");
const { checkOut } = require("../controllers/payment");
const router = express.Router();
const { verifyToken } = require("../middlewares/verify-token");
const { validationMiddleware } = require("../middlewares/api-validation");
const { check } = require("express-validator");

router.use(verifyToken);
router
  .route("/checkout")
  .post(
    ...[
      check("orderId").isMongoId().withMessage("Order Id is not valid"),
      validationMiddleware,
    ],
    checkOut
  );

module.exports = router;

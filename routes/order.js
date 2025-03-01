const express = require("express");
const router = express.Router();

const {
  newOrderValidator,
  updateOrderStatusValidator,
} = require("../services/validators/order");

const {
  addOrder,
  getOrders,
  specificOrder,
  updateOrderStatus,
} = require("../controllers/order");

const { verifyToken } = require("../middlewares/verify-token");

router.use(verifyToken);

router.route("/new").post(...newOrderValidator, addOrder);

router.route("/orders").get(getOrders);

router.route("/details").get(specificOrder);

router
  .route("/status/:status")
  .patch(...updateOrderStatusValidator, updateOrderStatus);
module.exports = router;

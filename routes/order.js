const express = require("express");
const router = express.Router();
const { newOrderValidator } = require("../services/validators/order");
const { addOrder } = require("../controllers/order");
const { verifyToken } = require("../middlewares/verify-token");
router.use(verifyToken);
router.route("/new").post(...newOrderValidator, addOrder);

module.exports = router;

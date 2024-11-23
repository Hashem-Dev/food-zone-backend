const express = require("express");
const { verifyToken } = require("../middlewares/verify-token");
const checkUserToken = require("../controllers/token");
const router = express.Router();

router.route("/").post(verifyToken, checkUserToken);

module.exports = router;

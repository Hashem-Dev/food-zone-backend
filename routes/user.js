const express = require("express");
const router = express.Router();
const { register } = require("../controllers/user");
const { registerValidator } = require("../services/validators/user");

router.route("/").post(registerValidator, register);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  verifyAdminToken,
  verifyToken,
} = require("../middlewares/verify-token");
const { getAllUsers, deleteUser } = require("../controllers/admin/user");
const { deleteUserValidator } = require("../services/validators/admin");

router.use(verifyToken, verifyAdminToken);
router.route("/users").get(getAllUsers);
router.route("/users/:id").delete(deleteUserValidator, deleteUser);

module.exports = router;

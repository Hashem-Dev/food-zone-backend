const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verify-token");
const {
  addAddress,
  getAllAddress,
  setDefaultAddress,
  deleteAddress,
  updateAddress,
  getNearestLocations,
} = require("../controllers/address");

router.use(verifyToken);

router.route("/").post(addAddress).get(getAllAddress);
router.route("/:id/default").patch(setDefaultAddress);
router.route("/:id").delete(deleteAddress).patch(updateAddress);
router.route("/nearest").get(getNearestLocations);
module.exports = router;

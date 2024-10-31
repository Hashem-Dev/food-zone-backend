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
const {
  addAddressValidator,
  setDefaultAddressValidator,
  deleteAddressValidator,
  updateAddressValidator,
} = require("../services/validators/address");

router.use(verifyToken);

router.route("/").post(addAddressValidator, addAddress).get(getAllAddress);

router
  .route("/:id/default")
  .patch(setDefaultAddressValidator, setDefaultAddress);

router
  .route("/:id")
  .delete(deleteAddressValidator, deleteAddress)
  .patch(updateAddressValidator, updateAddress);

router.route("/nearest").get(getNearestLocations);
module.exports = router;

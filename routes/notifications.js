const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { verifyToken } = require("../middlewares/verify-token");
const {
  getUserNotifications,
  deleteSpecificNotification,
  readSpecificNotification,
  readAllNotifications,
  deleteAllNotificationUser,
} = require("../controllers/notifications");
const { validationMiddleware } = require("../middlewares/api-validation");

router.use(verifyToken);

const validator = [
  check("notification").isMongoId().withMessage("Notification ID not valid."),
  validationMiddleware,
];

router
  .route("/user")
  .get(getUserNotifications)
  .delete(...validator, deleteSpecificNotification)
  .patch(...validator, readSpecificNotification);

router.route("/user/read-all").patch(readAllNotifications);
router.route("/user/delete-all").delete(deleteAllNotificationUser);
module.exports = router;

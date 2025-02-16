const asyncHandler = require("express-async-handler");
const { Notification, registerIcon } = require("../../models/Notification");
const ApiErrors = require("../../utils/api-errors");
const User = require("../../models/User");
const {
  sendNotificationToUser,
} = require("../../services/notifications/pushy_notifications");
const { Schema } = require("mongoose");

/**
 * @description Send notification to specific user
 * @route POST /api/v1/admin/notification/user
 * @access protected
 * */
const sendNotificationToSpecificUser = asyncHandler(async (req, res, next) => {
  const { user, title, message, type, priority } = req.body;

  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    priority,
    icon: { ...registerIcon },
  });
  if (!notification) {
    return next(
      new ApiErrors("Failed to send notification, user not found.", 404),
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    { _id: user },
    { $push: { notifications: notification._id } },
    { new: true },
  );

  if (!updatedUser) {
    return next(new ApiErrors("Failed to send notification to the user.", 400));
  }

  await sendNotificationToUser(title, message, updatedUser.deviceToken, next);
  return res
    .status(200)
    .json({ message: "Notification has been sent successfully." });
});

/**
 * @description Send notification to all users
 * @route POST /api/v1/admin/notification/all-users
 * @access protected
 * */
const sendNotificationToUsers = asyncHandler(async (req, res, next) => {
  const { title, message, type, priority } = req.body;
  const users = await User.find({});
  const deviceTokens = users
    .map((user) => user.deviceToken)
    .filter((token) => !!token);
  if (deviceTokens.length === 0) {
    return next(
      new ApiErrors("No device tokens found for send notification.", 404),
    );
  }
  const newNotification = await Notification.create({
    title,
    message,
    type,
    priority,
    icon: { ...registerIcon },
  });
  const updatedUsers = await User.updateMany(
    {},
    { $push: { notifications: newNotification._id } },
    { new: true },
  );
  if (!newNotification || !updatedUsers) {
    return next(new ApiErrors("Failed to send notification.", 404));
  }
  await sendNotificationToUsers(title, message, deviceTokens, next);
  return res.status(200).json(deviceTokens);
});
module.exports = {
  sendNotificationToSpecificUser,
  sendNotificationToUsers,
};

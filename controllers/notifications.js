const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiErrors = require("../utils/api-errors");
const ApiFeatures = require("../utils/api-features");
const ApiSuccess = require("../utils/api-success");
const { Notification } = require("../models/Notification");

/**
 * @decs Get all notifications related to user
 * @route GET /api/v1/notification/user
 * @access protected
 */
const getUserNotifications = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const existUser = await User.findById(user).populate("notifications", "-__v");

  if (!existUser) {
    return next(new ApiErrors(req.__("user_not_found", 404)));
  }

  // Today Notification Date.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Yesterday Notification Date.
  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  // Last Week Notification Date.
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const notifications = await Notification.aggregate([
    { $match: { user: existUser._id } },
    {
      $facet: {
        today: [
          { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
          { $project: { __v: 0, updatedAt: 0 } },
          { $sort: { isRead: 1, priority: -1 } },
          { $limit: 10 },
        ],

        yesterday: [
          {
            $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } },
          },
          { $project: { __v: 0, updatedAt: 0 } },
          { $sort: { isRead: 1, priority: -1 } },
          { $limit: 10 },
        ],

        lastWeek: [
          { $match: { createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } } },
          { $project: { __v: 0, updatedAt: 0 } },
          { $sort: { isRead: 1, priority: -1 } },
          { $limit: 10 },
        ],
        olderThanWeek: [
          { $match: { createdAt: { $lt: lastWeekStart } } },
          { $project: { __v: 0, updatedAt: 0 } },
          { $sort: { isRead: 1, priority: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  return res.status(200).json(notifications[0]);
});

/**
 * @decs Delete specific notification related to user
 * @route DELETE /api/v1/notification/user
 * @access protected
 */
const deleteSpecificNotification = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { notification } = req.query;

  const existNotification = await Notification.findByIdAndDelete(notification);
  if (!existNotification) {
    return next(new ApiErrors("Delete notification is failed.", 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    user,
    { $pull: { notifications: notification } },
    { new: true }
  );

  if (!updatedUser) {
    return next(new ApiErrors("user_not_found", 404));
  }
  return res.status(204).end();
});

/**
 * @descriptionription Mark specific notification as read
 * @route PATCH /api/v1/notification/user
 * @access protected
 * */
const readSpecificNotification = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { notification } = req.query;

  const updatedNotification = await Notification.findByIdAndUpdate(
    { _id: notification, user: user },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!updatedNotification) {
    return next(new ApiErrors("Notification was not found", 404));
  }

  return res.status(200).json(updatedNotification);
});

/**
 * @descriptionription Read all notifications related to user
 * @route PATCH /api/v1/notification/read-all
 * @access protected
 * */
const readAllNotifications = asyncHandler(async (req, res, next) => {
  const user = req.user;

  const existUser = await User.findById(user);

  if (!existUser) {
    return next(new ApiErrors(req.__("user_not_found")), 404);
  }

  const updatedNotifications = await Notification.updateMany(
    { user: user },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!updatedNotifications) {
    return next(new ApiErrors("Notifications was not found", 404));
  }
  return res.status(200).json(updatedNotifications);
});

/**
 * @descriptionription Delete all notifications related to user
 * @route DELETE /api/v1/notification/delete-all
 * @access protected
 * */
const deleteAllNotificationUser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const deletedNotifications = await Notification.deleteMany({ user: user });
  if (!deletedNotifications) {
    return next(new ApiErrors("Delete notifications was failed.", 404));
  }
  const updatedUser = await User.findByIdAndUpdate(
    user,
    { $set: { notifications: [] } },
    { new: true }
  );
  if (!updatedUser) {
    return next(new ApiErrors("Update user\'s notifications was failed.", 404));
  }
  return res.status(204).end();
});

module.exports = {
  getUserNotifications,
  deleteSpecificNotification,
  readSpecificNotification,
  readAllNotifications,
  deleteAllNotificationUser,
};

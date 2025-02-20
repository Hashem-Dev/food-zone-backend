const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Order = require("../models/Order");
const { Notification, orderPlacedIcon } = require("../models/Notification");
const ApiErrors = require("../utils/api-errors");
const {
  sendNotificationToUser,
} = require("../services/notifications/pushy_notifications");
const Meal = require("../models/Meals");
const { Promotion } = require("../models/Promotion");

const addOrder = asyncHandler(async (req, res, next) => {
  //const session = await mongoose.startSession();
  try {
    //   session.startTransaction();
    const user = req.user;
    const existUser = await User.findById(user);
    if (!existUser) {
      return next(new ApiErrors(req.__("user_not_found"), 404));
    }
    const {
      items,
      totalPrice,
      paymentIntentId,
      shippingAddress,
      paymentMethod,
      deliveryInstruction,
      shippingCost,
      discount,
      couponCode,
      cancellationReason,
      promotions,
    } = req.body;

    for (const item of items) {
      const existMeal = await Meal.findById(item.meal);
      if (!existMeal) {
        return next(
          new ApiErrors(`This meal with ID:${item.meal} does not exist.`, 404)
        );
      }

      if (item.additives && item.additives.length > 0) {
        const mealAdditives = existMeal.additives.map((addi) =>
          addi._id.toString()
        );

        for (const additive of item.additives) {
          if (!mealAdditives.includes(additive.toString())) {
            return next(
              new ApiErrors(
                `This additive with ID:${additive} does not exist.`,
                404
              )
            );
          }
        }
      }
    }

    const orderNumber = `ORD-${Math.floor(Math.random() * 10000)}-${Date.now()}`;
    const newOrder = await Order.create(
      [
        {
          items,
          totalPrice,
          orderNumber,
          paymentIntentId,
          shippingAddress,
          paymentMethod,
          deliveryInstruction,
          shippingCost,
          discount,
          couponCode,
          cancellationReason,
          promotions,
        },
      ]

      // { session },
    );
    if (!newOrder) {
      // await session.abortTransaction();
      // await session.endSession();
      return next(new ApiErrors("Failed to create this order", 400));
    }

    for (const id of promotions) {
      const updatePromotion = await Promotion.findByIdAndUpdate(
        { _id: id },
        { $inc: { usedCount: 1, maxUses: -1 } }
      );
      if (!updatePromotion) {
        return next(
          new ApiErrors(`Update promotion with id: ${id} has been failed.`)
        );
      }
    }
    const notificationTitle = "Order Successful";
    const notificationMessage = `Order ${newOrder[0].orderNumber} has been placed successfully.`;
    const notificationOrder = await Notification.create(
      [
        {
          user,
          title: notificationTitle,
          message: notificationMessage,
          icon: { ...orderPlacedIcon },
          priority: 5,
          type: "success",
        },
      ]
      // { session },
    );

    if (!existUser.deviceToken) {
      console.warn("User does not have a device token.");
    } else {
      await sendNotificationToUser(
        notificationTitle,
        notificationMessage,
        existUser.deviceToken,
        next
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      user,
      {
        $push: {
          notifications: notificationOrder[0]._id,
          orders: newOrder[0]._id,
          promotions: { $each: promotions },
        },
        $inc: { totalOrders: 1 },
      },
      { new: true }
    );
    if (!updatedUser) {
      return next(new ApiErrors("Failed to update user", 400));
    }

    // await session.commitTransaction();

    return res.status(201).json(newOrder);
  } catch (error) {
    // await session.abortTransaction();
    return next(error);
  } finally {
    // await session.endSession();
  }
});

module.exports = { addOrder };

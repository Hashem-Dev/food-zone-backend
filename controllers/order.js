const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Order = require("../models/Order");
const {
  Notification,
  orderPlacedIcon,
  orderConfirmedIcon,
  orderCanceledIcon,
} = require("../models/Notification");
const ApiErrors = require("../utils/api-errors");
const {
  sendNotificationToUser,
} = require("../services/notifications/pushy_notifications");
const Meal = require("../models/Meals");
const { Promotion } = require("../models/Promotion");

/**
 * @description Make new order.
 * @route POST /api/v1/order/new
 * @access protected
 */

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
      shippingAddress,
      deliveryInstruction,
      shippingCost,
      discount,
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
        const mealAdditives = existMeal.additives.map((additive) =>
          additive._id.toString()
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
          user,
          items,
          totalPrice,
          orderNumber,
          shippingAddress,
          deliveryInstruction,
          shippingCost,
          discount,
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

    return res.status(201).json(newOrder[0]._id);
  } catch (error) {
    // await session.abortTransaction();
    return next(error);
  } finally {
    // await session.endSession();
  }
});

/**
 * @description Get all user order by order status.
 * @route GET /api/v1/orders?status={status}&limit={limit}
 * @access protected
 */

const getOrders = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { status, limit, sort } = req.query;

  const existUser = await User.findById(user);
  if (!existUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }

  let filter = { user: user };

  if (status && status != undefined && status != "") {
    filter.status = status;
  }

  const userOrders = await Order.find(filter)
    .limit(limit)
    .select("totalPrice status orderNumber items.meal")
    .populate({
      path: "items.meal",
      select: "images",
    })
    .sort(sort)
    .lean();
  const ordersWithAllImages = userOrders.map((order) => ({
    id: order._id,
    totalPrice: order.totalPrice,
    status: order.status,
    orderNumber: order.orderNumber,
    allImages: order.items.flatMap((item) => {
      const images = shuffleArray(item.meal.images);
      return images[0];
    }),
  }));

  return res.status(200).json(ordersWithAllImages);
});

/**
 * @description Get specific order by ID
 * @route GET /api/v1/order/details?id={id}
 * @access protected
 */

const specificOrder = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const { id } = req.query;
  const existUser = await User.findById(user);

  if (!existUser) {
    return next(new ApiErrors(req.__("user_not_found", 404)));
  }

  const existOrder = await Order.findOne({ _id: id, user: user })
    .select("-paymentIntentId -paymentMethod -couponCode -__v")
    .populate({ path: "items.meal", populate: { path: "additives" } })
    .populate({
      path: "items.meal",
      populate: { path: "category", select: "title" },
    })
    .populate({
      path: "items.meal",
      populate: { path: "restaurant", select: "title logo" },
    })
    .populate({
      path: "shippingAddress",
      select: "country city addressTitle additionalInfo location",
    })
    .populate({
      path: "promotions",
      select: "name discountType discountValue",
    });

  if (!existOrder) {
    return next(new ApiErrors("Order not found!", 404));
  }

  const processedOrder = {
    ...existOrder.toObject(),
    items: existOrder.items.map((item) => ({
      ...item.toObject(),
      meal: {
        title: item.meal.title,
        images: item.meal.images,
        price: item.meal.price,
        rating: item.meal.rating,
        category: item.meal.category,
        restaurant: item.meal.restaurant,
        id: item.meal._id,
      },
      additives: item.additives
        .map((adId) =>
          item.meal.additives.find(
            (ad) => ad._id.toString() === adId.toString()
          )
        )
        .filter((ad) => ad !== undefined),
    })),
  };

  return res.status(200).json(processedOrder);
});

/**
 * @description Update order status
 * @route PATCH /api/order/status/{status}
 * @access protected
 */

const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const existUser = await User.findById(user);
  if (!existUser) {
    return next(new ApiErrors(req.__("user_not_found"), 404));
  }
  const { status } = req.params;
  const { paymentIntentId, orderId, reason } = req.body;
  let notificationTitle = "";
  let notificationMessage = "";
  let icon = {};

  const existOrder = await Order.findById(orderId);
  if (!existOrder) {
    return next(new ApiErrors("Order not found.", 404));
  }

  if (existOrder.status == "paid" || existOrder.status == "cancelled") {
    return next(new ApiErrors(`The order is already ${status}`, 400));
  }

  if (status === "paid") {
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: orderId },
      { $set: { status: "paid", paymentIntentId: paymentIntentId } },
      { new: true }
    );

    if (!updatedOrder) {
      return next(new ApiErrors("Update order process has been failed", 400));
    }
    notificationTitle = "Preparing Order";
    notificationMessage = `Preparing the order is starting, we notify you when it\'s done.`;
    icon = { ...orderConfirmedIcon };
  } else if (status === "cancelled") {
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: orderId },
      { $set: { status: "cancelled", cancellationReason: reason } },
      { new: true }
    );

    if (!updatedOrder) {
      return next(
        new ApiErrors("Order cancellation process has been failed", 400)
      );
    }

    notificationTitle = "Order Cancellation";
    notificationMessage = `The order was canceled successfully`;
    icon = { ...orderCanceledIcon };
  }

  const notificationOrder = await Notification.create([
    {
      user,
      title: notificationTitle,
      message: notificationMessage,
      icon: icon,
      priority: 5,
      type: "success",
    },
  ]);

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

  existUser.notifications.push(notificationOrder[0]._id);
  await existUser.save();

  return res.status(200).end();
});

module.exports = { addOrder, getOrders, specificOrder, updateOrderStatus };

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

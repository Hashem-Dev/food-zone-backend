const Stripe = require("stripe");
const asyncHandler = require("express-async-handler");
const ApiErrors = require("../utils/api-errors");
const Order = require("../models/Order");
const User = require("../models/User");
const {
  Notification,
  orderPlacedIcon,
  orderConfirmedIcon,
} = require("../models/Notification");
const {
  sendNotificationToUser,
} = require("../services/notifications/pushy_notifications");
const stripe = Stripe(process.env.STRIP_SECRET_KEY);

const checkOut = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;
  const user = req.user;

  const foundUser = await User.findById(user);
  if (!foundUser) {
    return next(new ApiErrors(req.__(user_not_found), 404));
  }

  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2024-06-20" }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
  });

  if (!paymentIntent) {
    return next(new ApiErrors("Error accrued with payment.", 400));
  }

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: process.env.STRIP_PUBLISHABLE_KEY,
  });
});

module.exports = { checkOut };

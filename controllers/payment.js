const Stripe = require("stripe");
const asyncHandler = require("express-async-handler");
const stripe = Stripe(process.env.STRIP_SECRET_KEY);

const checkOut = asyncHandler(async (req, res) => {
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2024-06-20" },
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "eur",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: process.env.STRIP_PUBLISHABLE_KEY,
  });
});

module.exports = { checkOut };

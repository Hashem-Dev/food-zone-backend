const { check } = require("express-validator");
const ApiErrors = require("../../utils/api-errors");
const { validationMiddleware } = require("../../middlewares/api-validation");

const newOrderValidator = [
  check("items")
    .notEmpty()
    .withMessage("You should add at least one meal.")
    .isLength({ min: 1 })
    .withMessage("Order must be at least 1 meal."),
  check("totalPrice").custom((value, { req }) => {
    if (value <= 0) {
      return new ApiErrors("Total price must be greater than zero.", 400);
    }
    const totalPrice = req.body.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    if (value !== totalPrice) {
      return new ApiErrors("Total price does not match the sum of items.");
    }
    req.body.totalPrice = totalPrice;
    return true;
  }),
  check("paymentIntentId")
    .notEmpty()
    .withMessage("Payment Intent ID is required"),
  check("shippingAddress")
    .notEmpty()
    .withMessage("Shipping Address is required")
    .isMongoId()
    .withMessage("Shipping Address ID not valid"),
  check("shippingCost").isNumeric().withMessage("Shipping Cost is required."),
  validationMiddleware,
];

module.exports = { newOrderValidator };

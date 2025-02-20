const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    items: [
      {
        meal: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        additives: [{ type: String }],
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    shippingAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    paymentMethod: { type: String, enum: ["cash", "card"], default: "card" },
    deliveryInstruction: { type: String, default: "" },
    shippingCost: { type: Number, required: true },
    orderNumber: { type: String, unique: true, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "coupon_code" },
    deliveryDate: { type: Date, default: Date.now() },
    cancellationReason: { type: String, default: "" },
    promotions: [{ type: Schema.Types.ObjectId, ref: "Promotion" }],
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

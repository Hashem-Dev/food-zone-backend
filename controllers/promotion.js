const User = require("../models/User");

const {
  validatePromotion,
  calculateDiscount,
  Promotion,
} = require("../models/Promotion");
const ApiErrors = require("../utils/api-errors");
const expressAsyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

/**
 * @description Apply promotion for orders
 * @route POST /api/v1/promotions/apply-promotion
 * @access protected
 */

const applyPromotion = async (req, res, next) => {
  try {
    const { promoCode, orderData } = req.body;
    const userId = req.user;

    const promotion = await Promotion.findOne({ code: promoCode });
    if (!promotion || !promotion.isActive) {
      return next(new ApiErrors("Invalid promotion code", 400));
    }

    if (promotion.usedCount >= promotion.maxUsage) {
      return next(new ApiErrors("Promotion usage limit reached", 403));
    }
    const orderDay = new Date().toLocaleString("en-US", { weekday: "long" });

    const user = await User.findById(userId);

    const context = {
      dayOfWeek: orderDay,
      firstOrder: user.totalOrders,
      orderTotal: orderData.total,
      itemCount: orderData.itemCount,
      userGroups: user.groups,
      timeOfDay: new Date(),
      items: orderData.items,
    };

    const validationResult = validatePromotion(promotion, context);
    console.log(validationResult);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: "Conditions not met",
        unmetConditions: validationResult.unmetConditions,
      });
    }

    const discount = calculateDiscount(promotion, orderData.total);

    await Promotion.updateOne(
      { _id: promotion._id },
      { $inc: { usedCount: 1 } },
    );

    res.json({
      success: true,
      discount,
      newTotal: orderData.total - discount,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @description Get specific promotion
 * @route GET /api/v1/promotion?id={id}
 * @access protected
 * */

const specificPromotion = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.query;

  if (!id || !mongoose.isValidObjectId(id)) {
    return next(new ApiErrors("Promotion id not valid", 400));
  }

  const existPromotion = await Promotion.findById(id).select("-__v -updatedAt");
  if (!existPromotion) {
    return next(new ApiErrors("Promotion not found", 403));
  }
  return res.status(200).json(existPromotion);
});
module.exports = {
  applyPromotion,
  specificPromotion,
};

const User = require("../models/User");

const {
  validatePromotion,
  calculateDiscount,
  Promotion,
} = require("../models/Promotion");
const ApiErrors = require("../utils/api-errors");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

/**
 * @description Apply promotion for orders
 * @route POST /api/v1/promotions/apply-promotion
 * @access protected
 */

const applyPromotion = asyncHandler(async (req, res, next) => {
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
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: "Conditions not met, check the promotion\'s conditions",
        unmetConditions: validationResult.unmetConditions,
      });
    }

    const discount = calculateDiscount(promotion, orderData.total);

    res.json({
      promotion: promotion._id,
      message: "Promotion applied successfully, Enjoy!",
      discount,
      newTotal: orderData.total - discount,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @description Get specific promotion
 * @route GET /api/v1/promotion?id={id}
 * @access protected
 * */

const specificPromotion = asyncHandler(async (req, res, next) => {
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

/**
 * @description Get all available promotions
 * @route GET /api/v1/promotions/all
 * @access protected
 */

const allPromotions = asyncHandler(async (req, res, next) => {
  const promotions = await Promotion.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $project: {
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  if (!promotions) {
    return next(new ApiErrors("No promotions found", 404));
  }

  return res.status(200).json(promotions);
});

module.exports = {
  applyPromotion,
  specificPromotion,
  allPromotions,
};

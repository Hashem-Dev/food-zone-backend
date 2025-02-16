const asyncHandler = require("express-async-handler");
const { Promotion } = require("../../models/Promotion");
const ApiErrors = require("../../utils/api-errors");
const User = require("../../models/User");
const crypto = require("crypto");
const { Notification } = require("../../models/Notification");
const {
  sendNotificationToUser,
} = require("../../services/notifications/pushy_notifications");

/**
 * @description Add new  promotion
 * @route POST /api/v1/admin/promotions/create
 * @access protected
 * */

const createPromotion = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    discountType,
    discountValue,
    condition,
    startDate,
    endDate,
    maxUses,
    isActive,
  } = req.body;
  const [sMonth, sDay, sYear] = startDate.split("/").map(Number);
  const [eMonth, eDay, eYear] = endDate.split("/").map(Number);

  const promotion = await Promotion.create({
    name,
    code: generatePromoCode(32),
    description,
    discountType,
    discountValue,
    condition,
    startDate: new Date(sYear, sMonth - 1, sDay),
    endDate: new Date(eYear, eMonth - 1, eDay),
    maxUses,
    isActive,
  });

  if (!promotion) {
    return next(new ApiErrors("Failed to create promotion", 400));
  }

  const users = await User.find({});
  /////////////
  ///// specify group user and send notification and promotions to them.
  ////////////
  const devicesToken = users.map((user) => user.deviceToken);

  // await sendNotificationToUser(name, description, devicesToken, next);

  return res.status(201).json(promotion);
});

module.exports = { createPromotion };

function generatePromoCode(length = 32) {
  const randomBytes = crypto.randomBytes(length);

  const promoCode = randomBytes.toString("hex").toUpperCase();

  return promoCode.slice(0, length);
}

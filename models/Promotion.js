const { Schema, model } = require("mongoose");

const conditionSchema = new Schema({
  field: {
    type: String,
    required: true,
    enum: [
      "orderTotal",
      "category",
      "userGroup",
      "itemCount",
      "timeOfDay",
      "delivery",
      "firstOrder",
      "dayOfWeek",
    ],
  },
  operator: {
    type: String,
    required: true,
    enum: [">", "<", "==", ">=", "<=", "in", "notIn"],
  },
  value: Schema.Types.Mixed,
});

const promotionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    discountValue: { type: Number, required: true },
    condition: [{ type: conditionSchema, required: true }],
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Promotion = model("Promotion", promotionSchema);

const validatePromotion = (promotion, context) => {
  const unmetConditions = [];

  promotion.condition.forEach((condition) => {
    const isValid = checkSingleCondition(condition, context);
    if (!isValid) {
      unmetConditions.push({
        field: condition.field,
        message: `Condition failed: ${condition.field} ${condition.operator} ${condition.value}`,
      });
    }
  });

  return {
    isValid: unmetConditions.length === 0,
    unmetConditions,
  };
};
const calculateDiscount = (promotion, orderTotal) => {
  if (promotion.discountType === "percentage") {
    return orderTotal * (promotion.discountValue / 100);
  } else {
    return Math.min(promotion.discountValue, orderTotal);
  }
};
const checkSingleCondition = (condition, context) => {
  const { field, operator, value } = condition;

  if (!context.hasOwnProperty(field)) {
    throw new Error(`Invalid field: ${field}`);
  }

  const actualValue = context[field];
  switch (field) {
    case "dayOfWeek":
      return checkDayOfWeekCondition(actualValue, operator, value);
    case "firstOrder":
      return actualValue === 0;
    case "orderTotal":
    case "itemCount":
      return compareNumbers(actualValue, operator, value);

    case "category":
      return checkCategoryCondition(actualValue, operator, value);
    case "userGroup":
      return checkArrayCondition(actualValue, operator, value);

    case "timeOfDay":
      return checkTimeCondition(actualValue, operator, value);

    default:
      throw new Error(`Unsupported field: ${field}`);
  }
};
const compareNumbers = (actual, operator, expected) => {
  switch (operator) {
    case ">":
      return actual > expected;
    case "<":
      return actual < expected;
    case ">=":
      return actual >= expected;
    case "<=":
      return actual <= expected;
    case "==":
      return actual === expected;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};
const checkDayOfWeekCondition = (orderDay, operator, expectedDays) => {
  const validDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  if (!validDays.includes(orderDay)) {
    throw new Error(`Invalid day: ${orderDay}`);
  }

  switch (operator) {
    case "in":
      return expectedDays.includes(orderDay);

    case "notIn":
      return !expectedDays.includes(orderDay);

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};
const checkArrayCondition = (actualArray, operator, expectedValues) => {
  switch (operator) {
    case "in":
      return expectedValues.some((val) => actualArray.includes(val));
    case "notIn":
      return !expectedValues.some((val) => actualArray.includes(val));
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};
const checkTimeCondition = (actualTime, operator, expectedHours) => {
  const hour = new Date(actualTime).getHours();

  switch (operator) {
    case "in":
      return expectedHours.includes(hour);
    case "notIn":
      return !expectedHours.includes(hour);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};
const checkCategoryCondition = (items, operator, expectedCategories) => {
  const actualCategories = items.map((item) => item);

  switch (operator) {
    case "in":
      return expectedCategories.some((cat) => actualCategories.includes(cat));

    case "notIn":
      return !expectedCategories.some((cat) => actualCategories.includes(cat));

    case "all":
      return expectedCategories.every((cat) => actualCategories.includes(cat));

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

module.exports = { validatePromotion, calculateDiscount, Promotion };

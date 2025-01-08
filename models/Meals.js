const { Schema, model } = require("mongoose");

const additiveSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true }, // Unique ID for each additive
  title: {
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  price: { type: Number, required: true },
  description: {
    en: { type: String },
    ar: { type: String },
  },
  type: {
    type: String,
    enum: [
      "sauce",
      "cheese",
      "side",
      "vegetable",
      "seasoning",
      "meat",
      "spice",
      "other",
    ],
    default: "other",
  },
});

const mealSchema = new Schema(
  {
    isNewMeal: { type: Boolean, default: true },
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    time: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    foodTags: {
      en: { type: Array, required: true },
      ar: { type: Array, required: true },
    },
    foodType: {
      en: { type: Array, required: true },
      ar: { type: Array, required: true },
    },
    coords: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    isAvailable: { type: Boolean, default: true },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    rating: { type: Number, min: 0, max: 5, default: 1 },
    ratingCount: { type: String, default: "0" },
    description: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    price: { type: Number, required: true },
    priceWithoutDiscount: { type: Number, default: 0.0 },
    additives: [{ type: additiveSchema }],
    nutritionalInfo: {
      calories: { type: String, default: "calories" },
      protein: { type: String, default: "protein" },
      carbs: { type: String, default: "carbs" },
      fat: { type: String, default: "fat" },
    },
    images: { type: Array },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Rating" }],
  },
  { timestamps: true }
);

const Meal = model("Meal", mealSchema);
module.exports = Meal;

const { Schema, model } = require("mongoose");

const additiveSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
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
    additives: {
      en: { type: [additiveSchema] },
      ar: { type: [additiveSchema] },
    },
    images: { type: Array, required: true },
  },
  { timestamps: true }
);

const Meal = model("Meal", mealSchema);
module.exports = Meal;

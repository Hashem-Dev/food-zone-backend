const { Schema, model } = require("mongoose");

const mealSchema = new Schema(
  {
    title: { type: String, required: true },
    time: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    foodTags: { type: Array, required: true },
    foodType: { type: Array, required: true },
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
    ratingCount: { type: String, default: "10" },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    additives: { type: Array, default: [] },
    images: { type: Array, required: true },
  },
  { timestamps: true }
);

const Meal = model("Meal", mealSchema);
module.exports = Meal;

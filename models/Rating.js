const { Schema, model } = require("mongoose");

const ratingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ratingType: {
      type: String,
      required: true,
      enum: ["Restaurant", "Driver", "Meal"],
    },
    mealId: { type: Schema.Types.ObjectId, ref: "Meal" },
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: "" },
    reviewImages: [{ type: String, default: "" }],
    isPositive: { type: Boolean, required: true },
  },
  { timestamps: true }
);
ratingSchema.index({ mealId: 1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ isPositive: 1 });

const Rating = model("Rating", ratingSchema);

module.exports = Rating;

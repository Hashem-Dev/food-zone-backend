const { Schema, model } = require("mongoose");

const ratingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    ratingType: {
      type: String,
      required: true,
      enum: ["Restaurant", "Driver", "Meal"],
    },
    product: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: "" },
    reviewImages: [{ type: String, default: "" }],
  },
  { timestamps: true }
);

const Rating = model("Rating", ratingSchema);

module.exports = Rating;

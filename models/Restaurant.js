const { Schema, model } = require("mongoose");

const restaurantsSchema = new Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  cover: { type: String, required: true },
  foods: { type: Array, default: [] },
  pickup: { type: Boolean, default: true },
  delivery: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  logo: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 1.5 },
  ratingCount: { type: String, default: "4453" },
  verification: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Verified", "Rejected"],
  },
  verificationMessage: {
    en: {
      type: String,
      default:
        "Your restaurant is under review, we well notify you once it is verified",
    },
    ar: {
      type: String,
      default: "مطعمك الآن تحت المراجعة، سوف نعلمك عند الموافقة عليه",
    },
  },
  coords: {
    id: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    latitudeDelta: { type: Number, default: 0.122 },
    longitudeDelta: { type: Number, default: 0.122 },
    address: { type: String, required: true },
    title: { type: String, required: true },
  },
});

restaurantsSchema.index({ coords: "2dsphere" });

const Restaurant = model("Restaurant", restaurantsSchema);
module.exports = Restaurant;

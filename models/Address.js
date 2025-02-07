const { Schema, model } = require("mongoose");

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    country: { type: String, required: [true, "Country is required"] },
    city: { type: String, default: "none" },
    street: { type: String, default: "none" },
    apartment: { type: String, default: "none" },
    defaultAddress: { type: Boolean, default: false },
    addressTitle: { type: String, default: "Title address" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    additionalInfo: { type: String },
  },
  { timestamps: true }
);

addressSchema.index({ location: "2dsphere" });

const Address = model("Address", addressSchema);
module.exports = Address;

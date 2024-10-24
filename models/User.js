const { Schema, model } = require("mongoose");
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minLength: [8, "Name is too short"],
      maxLength: [32, "Name is too long"],
    },
    slug: { type: String, required: [true, "Slug is required"] },
    email: {
      type: String,
      unique: [true, "E-mail already exists"],
      required: [true, "E-mail is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: 8,
    },
    avatar: { type: String, default: "uploads/avatars/avatar.png" },
    phone: { type: Number, default: "0981534952" },
    phoneVerification: { type: Boolean, default: false },
    passwordOtp: { type: Number, default: 0 },
    passwordOtpExpire: { type: Date },
    emailOtp: { type: Number, default: 0 },
    emailOtpExpire: { type: Date },
    addresses: [{ type: Schema.Types.ObjectId, ref: "Address", default: [] }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order", default: [] }],
    favoriteRestaurants: [
      { type: Schema.Types.ObjectId, ref: "Restaurant", default: [] },
    ],
    favoriteMeals: [{ type: Schema.Types.ObjectId, ref: "Meal", default: [] }],
    role: {
      type: String,
      default: "user",
      enum: ["user", "vendor", "delivery", "admin", "owner"],
    },
    isAdmin: { type: Boolean, default: false },
    accessToken: { type: String, required: [true, "Access token required"] },
    refreshToken: { type: String, required: [true, "Refresh token required"] },
  },
  { timestamps: true }
);
const User = model("User", userSchema);

module.exports = User;

const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "EN name is required"],
        minLength: [8, "Name is too short"],
        maxLength: [32, "Name is too long"],
      },
      ar: {
        type: String,
        required: [true, "AR name is required"],
        minLength: [8, "Name is too short"],
        maxLength: [32, "Name is too long"],
      },
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      lowercase: true,
    },
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
    accessToken: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

/** @Hashing Password */
userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
const User = model("User", userSchema);

module.exports = User;

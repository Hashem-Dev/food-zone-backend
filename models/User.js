const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const { sendEmailChangeOtp } = require("../utils/otp-sender");
const userSchema = new Schema(
  {
    googleId: { type: String, unique: false },
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
    dateOfBirth: { type: Date, default: "" },
    gender: { type: String, default: "" },
    avatar: {
      url: {
        type: String,
        default:
          "https://cdn.icon-icons.com/icons2/3066/PNG/512/user_person_profile_avatar_icon_190943.png",
      },
      publicId: { type: String },
    },
    phone: { type: Number, default: "09000000000" },
    phoneVerification: { type: Boolean, default: false },
    passwordOtp: { type: Number, default: 0 },
    passwordOtpExpire: { type: Date },
    emailOtp: { type: Number, default: 0 },
    emailOtpExpire: { type: Date },
    addresses: [{ type: Schema.Types.ObjectId, ref: "Address", default: [] }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order", default: [] }],
    favoriteRestaurants: [
      {
        restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
        isAdded: { type: Boolean, default: false },
      },
    ],
    favoriteMeals: [
      {
        meals: { type: Schema.Types.ObjectId, ref: "Meal" },
        isAdded: { type: Boolean, default: false },
      },
    ],
    role: {
      type: String,
      default: "user",
      enum: ["user", "vendor", "delivery", "admin", "owner"],
    },
    isAdmin: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    logout: { type: Date },
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

/** Send verification code after updating user email */
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (this.options.context) {
    const req = this.options.context.req;
    const thisUser = await this.model.findOne(this.getQuery());
    try {
      if (update && update.$set) {
        if (update.$set.password) {
          const salt = await bcrypt.genSalt(12);
          update.$set.password = await bcrypt.hash(update.$set.password, salt);
        }

        if (update.$set.email) {
          const emailOtp = await sendEmailChangeOtp(
            update.$set.email,
            req.language
          );
          const emailOtpExpire = Date.now() + 10 * 60 * 1000;
          thisUser.emailOtp = emailOtp;
          thisUser.emailOtpExpire = emailOtpExpire;
          await thisUser.save();
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }
});
const User = model("User", userSchema);

module.exports = User;

const { Schema, model } = require("mongoose");
const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    title: { type: String, required: true, maxLength: 100 },
    message: { type: String, required: true, maxLength: 500 },
    icon: {
      codePoint: { type: Number, required: true },
      fontFamily: { type: String, default: "SolarIconsOutline" },
      fontPackage: { type: String, default: "solar_icons" },
      color: {
        type: String,
        default: "13c296",
        match: /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      },
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    isRead: { type: Boolean, default: false, index: true },
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
notificationSchema.index({ user: 1, isRead: 1 });
const Notification = model("Notification", notificationSchema);

const registerIcon = {
  codePoint: 60727,
};

const orderPlacedIcon = { codePoint: 60464 };

const orderConfirmedIcon = { codePoint: 60479 };

const orderCanceledIcon = { codePoint: 60887, color: "ff6347" };

module.exports = {
  Notification,
  registerIcon,
  orderPlacedIcon,
  orderConfirmedIcon,
  orderCanceledIcon,
};

const { Schema, model } = require("mongoose");

const categorySchema = new Schema({
  title: {
    en: { type: String, required: true, unique: true },
    ar: { type: String, required: true, unique: true },
  },
  value: { type: String, required: true, lowercase: true },
  slug: { type: String, lowercase: true },
  icon: { type: String, required: true },
});

const Category = model("Category", categorySchema);

module.exports = Category;

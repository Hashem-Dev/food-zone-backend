const { Schema, model } = require("mongoose");

const categorySchema = new Schema({
  title: {
    en: { type: String, required: true, unique: true, index: 1 },
    ar: { type: String, required: true, unique: true, index: 1 },
  },
  value: { type: String, required: true, lowercase: true, index: 1 },
  slug: { type: String, lowercase: true },
  icon: { type: String, required: true },
});

categorySchema.index(
  {
    "title.en": "text",
    "title.ar": "text",
    value: "text",
  },
  {
    name: "category_search_index",
    weights: {
      "title.en": 3,
      "title.ar": 3,
      value: 1,
    },
  }
);
const Category = model("Category", categorySchema);

module.exports = Category;

const slugify = require("slugify");

const enSlugify = (text) => {
  return slugify(text);
};

const arSlugify = (text) => {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF0-9\-]/g, "")
    .toLowerCase();
};
function isArabic(text) {
  const arabicPattern = /[\u0600-\u06FF]/; // نطاق الأحرف العربية
  return arabicPattern.test(text);
}
const slugifyName = (username, req) => {
  let slug;
  if (isArabic(username)) {
    slug = arSlugify(username);
  } else {
    slug = enSlugify(username);
  }
  req.body.name = {};
  req.body.name.en = username;
  req.body.name.ar = username;
  req.body.slug = slug;
};

module.exports = {
  enSlugify,
  arSlugify,
  slugifyName,
};

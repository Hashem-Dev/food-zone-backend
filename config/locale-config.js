const locale = require("i18n");
const path = require("path");

const localesPath = path.join(__dirname, "..", "locales");

locale.configure({
  locales: ["en", "ar"],
  directory: localesPath,
  defaultLocale: "en",
  cookie: "lang",
});
const localization = locale.init;

const serverLanguage = (req, res, next) => {
  const language =
    req.headers["accept-language"] || req.headers["Accept-Language"] || "en";
  req.language = language.includes("ar") ? "ar" : "en";
  next();
};

module.exports = { localization, serverLanguage };

const multer = require("multer");
const path = require("path");
const ApiErrors = require("../../utils/api-errors");

const mealImagesPath = path.join(__dirname + "../../../uploads/meals");

const mealImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mealImagesPath);
  },
  filename: function (req, file, cb) {
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const mealImagesName =
      "meal-image-" + uniqueId + path.extname(file.originalname);
    cb(null, mealImagesName);
  },
});

const fileFilter = function (req, file, cb) {
  const allowedType = /png|jpeg|jpg/;
  const imageExtension = allowedType.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeType = allowedType.test(file.mimetype);

  if (imageExtension && mimeType) {
    return cb(null, true);
  } else {
    return cb(
      new ApiErrors("Only png, jpeg, jpg allowed, try again", 400),
      false
    );
  }
};

const uploadMealImages = multer({
  storage: mealImageStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = uploadMealImages;

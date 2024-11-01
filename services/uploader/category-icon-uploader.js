const multer = require("multer");
const path = require("path");
const ApiErrors = require("../../utils/api-errors");
const categoryIconPath = path.join(__dirname + "../../../uploads/category/");

const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, categoryIconPath);
  },
  filename: function (req, file, cb) {
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const categoryIconName =
      "category-icon-" + uniqueId + path.extname(file.originalname);
    cb(null, categoryIconName);
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
      new ApiErrors("Only png, jpeg, jpg image files are allowed", 400),
      false
    );
  }
};

const uploadCategoryIcon = multer({
  storage: categoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = uploadCategoryIcon;

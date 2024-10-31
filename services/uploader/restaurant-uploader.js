const multer = require("multer");
const path = require("path");
const ApiErrors = require("../../utils/api-errors");
const coverPath = path.join(__dirname + "../../../uploads/restaurants/cover");
const logoPath = path.join(__dirname + "../../../uploads/restaurants/logo");

const fileFilter = (_, file, cb) => {
  const allowedType = /png|jpg|jpeg/;
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

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === "logo") {
        cb(null, logoPath);
      } else if (file.fieldname === "cover") {
        cb(null, coverPath);
      }
    },
    filename: function (req, file, cb) {
      const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileName =
        file.fieldname + "-" + uniqueId + path.extname(file.originalname);
      cb(null, fileName);
    },
  }),
  fileFilter: fileFilter,
});

module.exports = upload;

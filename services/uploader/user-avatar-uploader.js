const multer = require("multer");
const path = require("path");
const ApiErrors = require("../../utils/api-errors");
const uploadPath = path.join(__dirname + "../../../uploads/avatars/");

const storage = multer.diskStorage({
  destination: function (_, _, cb) {
    cb(null, uploadPath);
  },

  filename: function (_, file, cb) {
    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const avatarName = "avatar-" + uniqueId + path.extname(file.originalname);
    cb(null, avatarName);
  },
});

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
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
});

module.exports = upload;

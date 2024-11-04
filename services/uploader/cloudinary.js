const express = require("express");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const router = express.Router();

// Configure Cloudinary with your account details
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc Upload user avatar by cloudinary
 * @param {*} file
 * @param {*} folder
 * @param {*} prefix
 */
const uploadImage = async (file, folder, prefix) => {
  return new Promise((resolve, reject) => {
    const publicId = `${prefix}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: folder,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = {
  uploadImage,
};

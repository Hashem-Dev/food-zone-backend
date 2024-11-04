const express = require("express");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const router = express.Router();

// Configure Cloudinary with your account details
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer to temporarily store files
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint for image upload
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { folder: "random" }, // Specify folder on Cloudinary
      (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Error uploading image" });
        }
        res.json({ imageUrl: result.url });
      }
    );

    // Pass the file buffer to Cloudinary's upload stream
    result.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: "Error uploading image" });
  }
});

module.exports = router;

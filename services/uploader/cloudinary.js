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
const upload = multer({ dest: "uploads/" });

// Endpoint for image upload
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // Upload the image to Cloudinary using the temporary file path
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "random", // Specify folder on Cloudinary
    });

    // Delete the temporary file after upload
    fs.unlinkSync(req.file.path);

    // Send the image URL as a response
    res.json({ imageUrl: result.url });
  } catch (error) {
    res.status(500).json({ error: "Error uploading image" });
  }
});

module.exports = router;

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Shop = require("../models/Shop");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── multer: store temporarily with original name, we rename after ─────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // name after shop _id so it always overwrites the same file
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `shop-${req.params.id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// POST /api/v1/shops/:id/upload
// - saves file as shop-{id}.ext (overwrites any previous image for this shop)
// - updates the shop's picture field in the DB
// - returns the new picture URL
router.post("/:id/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file received" });
  }

  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      // clean up the uploaded file if shop doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // delete old file if it has a different extension (e.g. old was .png, new is .jpg)
    if (shop.picture) {
      const oldFilename = path.basename(shop.picture);
      const oldPath = path.join(uploadDir, oldFilename);
      if (fs.existsSync(oldPath) && oldFilename !== req.file.filename) {
        fs.unlinkSync(oldPath);
      }
    }

    const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const pictureUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // update picture field in DB
    shop.picture = pictureUrl;
    await shop.save();

    res.status(200).json({ success: true, url: pictureUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
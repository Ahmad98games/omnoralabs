const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { protect, seller, customer, admin } = require('../middleware/auth');
const {
    uploadImage,
    getGallery
} = require('../controllers/mediaController');

// ─── MULTER CONFIGURATION ────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // SECURITY: Sanitize filename and use UUID to prevent collisions & directory traversal
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // SECURITY: Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('INVALID_FILE_TYPE: Only JPEG, PNG, GIF, WebP, and SVG are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB Limit
    }
});

// â”€â”€â”€ ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * @desc    Upload new image asset
 * @route   POST /api/media/upload
 */
router.post('/upload', protect, customer, upload.single('image'), uploadImage);

/**
 * @desc    Get paginated gallery of images
 * @route   GET /api/media/gallery
 */
router.get('/gallery', protect, customer, getGallery);

module.exports = router;

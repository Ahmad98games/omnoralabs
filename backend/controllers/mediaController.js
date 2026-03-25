// [Mongoose Removed] const { ImageAsset } = require('../models/Phase3Models');
const path = require('path');

const mediaController = {
    /**
     * @desc    Upload image and register in DB
     */
    uploadImage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file provided' });
            }

            const { originalname, filename, size, mimetype } = req.file;
            const targetTenant = req.tenantId || 'default_tenant';

            res.status(201).json({
                success: true,
                message: 'Image asset registered',
                asset: {
                    id: filename,
                    url: `/uploads/${filename}`,
                    originalName: originalname,
                    size: size
                }
            });
        } catch (error) {
            console.error('[MEDIA_UPLOAD_ERR]', error);
            res.status(500).json({ success: false, error: error.message || 'Internal Server Error during upload' });
        }
    },

    /**
     * @desc    Get gallery for tenant/seller
     */
    getGallery: async (req, res) => {
        try {
            const targetTenant = req.tenantId || 'default_tenant';
            const { page = 1, limit = 20 } = req.query;

            const query = req.user.role === 'super-admin'
                ? { tenant_id: targetTenant }
                : { tenant_id: targetTenant, seller: req.user._id };

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const assets = await ImageAsset.find(query)
                .sort({ uploadedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await ImageAsset.countDocuments(query);

            res.json({
                success: true,
                assets,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('[MEDIA_GALLERY_ERR]', error);
            res.status(500).json({ success: false, error: 'Internal Server Error fetching gallery' });
        }
    }
};

module.exports = mediaController;

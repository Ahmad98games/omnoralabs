/**
 * Wishlist Controller
 * Handles all wishlist operations
 */

const mongoose = require('mongoose');
const { Wishlist, WishlistService } = require('../models/Wishlist');

const toObjectId = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

class WishlistController {
  /**
   * Add product to wishlist
   * POST /api/wishlist/add
   */
  static async addToWishlist(req, res) {
    try {
      const userId = req.user?._id || req.user?.id || req.body.userId;
      const { productId, productName, price, image, skinType, priority } = req.body;
      const mongoProductId = toObjectId(productId);

      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      if (!mongoProductId || !productName || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid fields: productId, productName, price'
        });
      }

      const productData = {
        productId: mongoProductId,
        productName,
        price: parseFloat(price),
        image,
        skinType,
        priority: priority || 2
      };

      const result = await WishlistService.addToWishlist(userId, productData);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in addToWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add to wishlist'
      });
    }
  }

  /**
   * Remove product from wishlist
   * DELETE /api/wishlist/remove/:productId
   */
  static async removeFromWishlist(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { productId } = req.params;
      const mongoProductId = toObjectId(productId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }
      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid productId'
        });
      }

      const result = await WishlistService.removeFromWishlist(userId, mongoProductId);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in removeFromWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove from wishlist'
      });
    }
  }

  /**
   * Get user's wishlist
   * GET /api/wishlist
   */
  static async getWishlist(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { includeStats } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await WishlistService.getWishlist(userId, includeStats === 'true');

      return res.json(result);
    } catch (error) {
      console.error('Error in getWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch wishlist'
      });
    }
  }

  /**
   * Check if product is in wishlist
   * GET /api/wishlist/check/:productId
   */
  static async checkWishlist(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { productId } = req.params;
      const mongoProductId = toObjectId(productId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }
      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid productId'
        });
      }

      const inWishlist = await WishlistService.isInWishlist(userId, mongoProductId);

      return res.json({
        success: true,
        inWishlist
      });
    } catch (error) {
      console.error('Error in checkWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check wishlist'
      });
    }
  }

  /**
   * Update product priority
   * PUT /api/wishlist/:productId/priority
   */
  static async updatePriority(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { productId } = req.params;
      const { priority } = req.body;
      const mongoProductId = toObjectId(productId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      if (!priority || ![1, 2, 3].includes(priority)) {
        return res.status(400).json({
          success: false,
          error: 'Priority must be 1 (high), 2 (medium), or 3 (low)'
        });
      }

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid productId'
        });
      }

      const result = await WishlistService.updatePriority(userId, mongoProductId, priority);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in updatePriority:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update priority'
      });
    }
  }

  /**
   * Generate shareable wishlist link
   * POST /api/wishlist/share
   */
  static async generateShareLink(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await WishlistService.generateShareLink(userId);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in generateShareLink:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate share link'
      });
    }
  }

  /**
   * Get shared wishlist (public)
   * GET /api/wishlist/shared/:shareToken
   */
  static async getSharedWishlist(req, res) {
    try {
      const { shareToken } = req.params;

      if (!shareToken) {
        return res.status(400).json({
          success: false,
          error: 'Share token required'
        });
      }

      const result = await WishlistService.getSharedWishlist(shareToken);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in getSharedWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch shared wishlist'
      });
    }
  }

  /**
   * Enable/disable stock notifications
   * PUT /api/wishlist/:productId/notifications
   */
  static async updateNotifications(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;
      const { productId } = req.params;
      const { enable } = req.body;
      const mongoProductId = toObjectId(productId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }
      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid productId'
        });
      }

      const result = await WishlistService.enableStockNotifications(
        userId,
        mongoProductId,
        enable !== false
      );

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in updateNotifications:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update notifications'
      });
    }
  }

  /**
   * Clear entire wishlist
   * DELETE /api/wishlist/clear
   */
  static async clearWishlist(req, res) {
    try {
      const userId = req.user?._id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await WishlistService.clearWishlist(userId);

      return res.json(result);
    } catch (error) {
      console.error('Error in clearWishlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear wishlist'
      });
    }
  }

  /**
   * Get all wishlists with out-of-stock items (admin/service only)
   * GET /api/admin/wishlists/out-of-stock/:productId
   */
  static async getWishlistsWithOutOfStock(req, res) {
    try {
      const { productId } = req.params;
      const mongoProductId = toObjectId(productId);

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId required'
        });
      }

      const result = await WishlistService.getWishlistsWithOutOfStockItems(mongoProductId);

      return res.json(result);
    } catch (error) {
      console.error('Error in getWishlistsWithOutOfStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch wishlists'
      });
    }
  }

  /**
   * Mark notification sent (admin/service only)
   * PUT /api/admin/wishlist/:wishlistId/mark-notification
   */
  static async markNotificationSent(req, res) {
    try {
      const { wishlistId } = req.params;
      const { productId } = req.body;
      const mongoProductId = toObjectId(productId);

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid productId'
        });
      }

      const result = await WishlistService.markNotificationSent(wishlistId, mongoProductId);

      return res.json(result);
    } catch (error) {
      console.error('Error in markNotificationSent:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark notification'
      });
    }
  }
}

module.exports = WishlistController;

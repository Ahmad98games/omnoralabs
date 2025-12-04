/**
 * Wishlist System
 * Features:
 * - Add/Remove products
 * - Share wishlist
 * - Track when items came back in stock
 * - Wishlist notifications
 * - Compare products
 */

const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    price: Number,
    image: String,
    skinType: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    notifyOnBackInStock: {
      type: Boolean,
      default: true
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationSentAt: Date,
    priority: {
      type: Number,
      enum: [1, 2, 3], // 1=high, 2=medium, 3=low
      default: 2
    }
  }],
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    email: String,
    sharedAt: Date,
    viewedAt: Date,
    viewCount: { type: Number, default: 0 }
  }],
  totalItems: {
    type: Number,
    default: 0,
    index: true
  },
  totalValue: {
    type: Number,
    default: 0
  },
  lastModified: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update totalItems and totalValue before saving
WishlistSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.totalValue = this.items.reduce((sum, item) => sum + (item.price || 0), 0);
  this.lastModified = new Date();
  next();
});

// Create index for efficient lookups
WishlistSchema.index({ userId: 1, 'items.productId': 1 });

const Wishlist = mongoose.model('Wishlist', WishlistSchema);

class WishlistService {
  /**
   * Add product to wishlist
   */
  static async addToWishlist(userId, productData) {
    try {
      let wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        wishlist = new Wishlist({
          userId,
          items: [{
            productId: productData.productId,
            productName: productData.productName,
            price: productData.price,
            image: productData.image,
            skinType: productData.skinType,
            addedAt: new Date(),
            notifyOnBackInStock: true,
            priority: productData.priority || 2
          }]
        });
      } else {
        // Check if already in wishlist
        const exists = wishlist.items.find(
          item => item.productId?.toString() === productData.productId.toString()
        );
        if (exists) {
          return {
            success: false,
            error: 'Product already in wishlist',
            inWishlist: true
          };
        }

        wishlist.items.push({
          productId: productData.productId,
          productName: productData.productName,
          price: productData.price,
          image: productData.image,
          skinType: productData.skinType,
          addedAt: new Date(),
          notifyOnBackInStock: true,
          priority: productData.priority || 2
        });
      }

      await wishlist.save();

      return {
        success: true,
        wishlist,
        inWishlist: true,
        message: `${productData.productName} added to wishlist!`
      };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        error: error.message,
        inWishlist: false
      };
    }
  }

  /**
   * Remove product from wishlist
   */
  static async removeFromWishlist(userId, productId) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return { success: false, error: 'Wishlist not found' };
      }

      wishlist.items = wishlist.items.filter(
        item => item.productId?.toString() !== productId.toString()
      );
      await wishlist.save();

      return {
        success: true,
        wishlist,
        inWishlist: false,
        message: 'Product removed from wishlist'
      };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's wishlist
   */
  static async getWishlist(userId, includeStats = false) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return {
          success: true,
          wishlist: {
            userId,
            items: [],
            totalItems: 0,
            totalValue: 0
          }
        };
      }

      if (includeStats) {
        const stats = {
          byPriority: {
            high: wishlist.items.filter(i => i.priority === 1).length,
            medium: wishlist.items.filter(i => i.priority === 2).length,
            low: wishlist.items.filter(i => i.priority === 3).length
          },
          bySkinType: {},
          oldestAdd: wishlist.items.length > 0 
            ? Math.min(...wishlist.items.map(i => i.addedAt.getTime()))
            : null
        };

        // Count by skin type
        wishlist.items.forEach(item => {
          const type = item.skinType || 'Unknown';
          stats.bySkinType[type] = (stats.bySkinType[type] || 0) + 1;
        });

        return {
          success: true,
          wishlist,
          stats
        };
      }

      return { success: true, wishlist };
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if product is in wishlist
   */
  static async isInWishlist(userId, productId) {
    try {
      const wishlist = await Wishlist.findOne({
        userId,
        'items.productId': productId
      });

      return wishlist ? true : false;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  }

  /**
   * Update product priority in wishlist
   */
  static async updatePriority(userId, productId, priority) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return { success: false, error: 'Wishlist not found' };
      }

      const item = wishlist.items.find(
        i => i.productId?.toString() === productId.toString()
      );
      if (!item) {
        return { success: false, error: 'Product not in wishlist' };
      }

      item.priority = priority;
      await wishlist.save();

      return {
        success: true,
        message: 'Priority updated',
        wishlist
      };
    } catch (error) {
      console.error('Error updating priority:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate shareable wishlist link
   */
  static async generateShareLink(userId) {
    try {
      const shareToken = require('crypto').randomBytes(16).toString('hex');
      
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        {
          shareToken,
          isPublic: true,
          lastModified: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/shared/${shareToken}`,
        shareToken
      };
    } catch (error) {
      console.error('Error generating share link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get shared wishlist
   */
  static async getSharedWishlist(shareToken) {
    try {
      const wishlist = await Wishlist.findOne({
        shareToken,
        isPublic: true
      }).select('items totalValue -userId -shareToken');

      if (!wishlist) {
        return { success: false, error: 'Wishlist not found or not shared' };
      }

      // Track view
      await Wishlist.updateOne(
        { _id: wishlist._id },
        { $inc: { 'sharedWith.0.viewCount': 1 } }
      );

      return {
        success: true,
        wishlist
      };
    } catch (error) {
      console.error('Error getting shared wishlist:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable stock notifications
   */
  static async enableStockNotifications(userId, productId, enable = true) {
    try {
      const wishlist = await Wishlist.findOne({ userId });

      if (!wishlist) {
        return { success: false, error: 'Wishlist not found' };
      }

      const item = wishlist.items.find(
        i => i.productId?.toString() === productId.toString()
      );
      if (!item) {
        return { success: false, error: 'Product not in wishlist' };
      }

      item.notifyOnBackInStock = enable;
      await wishlist.save();

      return {
        success: true,
        message: `Notifications ${enable ? 'enabled' : 'disabled'}`,
        wishlist
      };
    } catch (error) {
      console.error('Error updating notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wishlists with out-of-stock items (for admin/notification service)
   */
  static async getWishlistsWithOutOfStockItems(productId) {
    try {
      const wishlists = await Wishlist.find({
        'items.productId': productId,
        'items.notifyOnBackInStock': true,
        'items.notificationSent': false
      });

      return { success: true, wishlists };
    } catch (error) {
      console.error('Error getting wishlists:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification sent
   */
  static async markNotificationSent(wishlistId, productId) {
    try {
      const wishlist = await Wishlist.findById(wishlistId);

      if (!wishlist) {
        return { success: false, error: 'Wishlist not found' };
      }

      const item = wishlist.items.find(
        i => i.productId?.toString() === productId.toString()
      );
      if (item) {
        item.notificationSent = true;
        item.notificationSentAt = new Date();
      }

      await wishlist.save();

      return { success: true };
    } catch (error) {
      console.error('Error marking notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear wishlist
   */
  static async clearWishlist(userId) {
    try {
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { items: [], totalItems: 0, totalValue: 0 },
        { new: true }
      );

      return {
        success: true,
        message: 'Wishlist cleared',
        wishlist
      };
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  Wishlist,
  WishlistService
};

/**
 * Review Controller
 * Handles all review operations
 */

const { Review, ReviewService } = require('../models/Review');
const { Order } = require('../models/Order');

class ReviewController {
  /**
   * Create a new review
   * POST /api/reviews
   */
  static async createReview(req, res) {
    try {
      const { productId, rating, title, text, photos, skinType, ageRange } = req.body;
      const userId = req.user?.id || req.body.userId;

      // Validation
      if (!productId || !rating || !title || !text) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: productId, rating, title, text'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      // Check if user already reviewed this product
      const existing = await ReviewService.getUserReview(productId, userId);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this product. Edit your existing review instead.'
        });
      }

      // Check verified purchase
      let isVerifiedPurchase = false;
      if (userId && req.user?.id === userId) {
        const purchase = await Order.findOne({
          userId,
          'items.productId': productId,
          status: { $in: ['completed', 'shipped', 'delivered'] }
        });
        isVerifiedPurchase = !!purchase;
      }

      const reviewData = {
        productId,
        userId,
        userName: req.body.userName || 'Anonymous',
        userEmail: req.user?.email || req.body.userEmail,
        rating: parseInt(rating),
        title: title.trim(),
        text: text.trim(),
        photos: photos || [],
        isVerifiedPurchase,
        skinType,
        ageRange
      };

      const result = await ReviewService.createReview(reviewData);

      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in createReview:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error: ' + error.message
      });
    }
  }

  /**
   * Get reviews for a product
   * GET /api/reviews/product/:productId
   */
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { rating, sortBy, page, limit, verifiedOnly } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const filters = {
        rating: rating ? parseInt(rating) : null,
        sortBy: sortBy || 'newest',
        limit: Math.min(parseInt(limit) || 10, 50), // Max 50
        page: Math.max(parseInt(page) || 1, 1),
        verifiedOnly: verifiedOnly === 'true'
      };

      // Remove null values
      Object.keys(filters).forEach(key => filters[key] === null && delete filters[key]);

      const result = await ReviewService.getProductReviews(productId, filters);

      return res.json(result);
    } catch (error) {
      console.error('Error in getProductReviews:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews'
      });
    }
  }

  /**
   * Get review statistics for a product
   * GET /api/reviews/stats/:productId
   */
  static async getReviewStats(req, res) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const stats = await ReviewService.getReviewStats(productId);

      return res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error in getReviewStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch review statistics'
      });
    }
  }

  /**
   * Get top reviews for a product
   * GET /api/reviews/top/:productId
   */
  static async getTopReviews(req, res) {
    try {
      const { productId } = req.params;
      const { limit } = req.query;

      const reviews = await ReviewService.getTopReviews(
        parseInt(productId),
        parseInt(limit) || 3
      );

      return res.json({
        success: true,
        reviews
      });
    } catch (error) {
      console.error('Error in getTopReviews:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch top reviews'
      });
    }
  }

  /**
   * Mark review as helpful
   * POST /api/reviews/:reviewId/helpful
   */
  static async markHelpful(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User ID required'
        });
      }

      const result = await ReviewService.markHelpful(reviewId, userId);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      console.error('Error in markHelpful:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to mark review'
      });
    }
  }

  /**
   * Edit a review
   * PUT /api/reviews/:reviewId
   */
  static async editReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const { rating, title, text, photos } = req.body;

      const result = await ReviewService.editReview(reviewId, userId, {
        rating,
        title,
        text,
        photos
      });

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in editReview:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to edit review'
      });
    }
  }

  /**
   * Delete a review
   * DELETE /api/reviews/:reviewId
   */
  static async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin';

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const result = await ReviewService.deleteReview(reviewId, userId, isAdmin);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(403).json(result);
      }
    } catch (error) {
      console.error('Error in deleteReview:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete review'
      });
    }
  }

  /**
   * Moderate reviews (admin only)
   * PUT /api/admin/reviews/:reviewId/moderate
   */
  static async moderateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { status, notes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status must be "approved" or "rejected"'
        });
      }

      const result = await ReviewService.moderateReview(reviewId, status, notes);

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in moderateReview:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to moderate review'
      });
    }
  }

  /**
   * Get pending reviews (admin only)
   * GET /api/admin/reviews/pending
   */
  static async getPendingReviews(req, res) {
    try {
      const { limit = 20, page = 1 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reviews = await Review.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments({ status: 'pending' });

      return res.json({
        success: true,
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error in getPendingReviews:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending reviews'
      });
    }
  }

  /**
   * Get user's reviews
   * GET /api/reviews/user/:userId
   */
  static async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, page = 1 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const reviews = await Review.find({ userId, status: 'approved' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-userEmail');

      const total = await Review.countDocuments({ userId, status: 'approved' });

      return res.json({
        success: true,
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error in getUserReviews:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user reviews'
      });
    }
  }
}

module.exports = ReviewController;

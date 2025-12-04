/**
 * Review & Rating System
 * Features:
 * - Star ratings (1-5)
 * - Text reviews with titles
 * - Photo attachments
 * - Verified purchase badge
 * - Helpful votes
 * - Edit/Delete by owner
 * - Admin moderation
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: String,
  userEmail: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  text: {
    type: String,
    required: true,
    maxlength: 5000
  },
  photos: [{
    url: String,
    uploadedAt: Date
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userHelpfulVotes: [String], // User IDs who marked as helpful
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatorNotes: String,
  skinType: String, // e.g., "Sensitive", "Oily", "Normal"
  ageRange: String, // e.g., "18-25", "25-35"
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
ReviewSchema.index({ productId: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, rating: 1 });

// Calculate average rating before saving
ReviewSchema.pre('save', async function(next) {
  if (this.isModified('rating') || this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

const Review = mongoose.model('Review', ReviewSchema);

class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(reviewData) {
    try {
      const review = new Review({
        ...reviewData,
        status: 'approved', // Auto-approve for now, add moderation if needed
        createdAt: new Date()
      });

      await review.save();

      // Recalculate product rating
      await this.updateProductRating(reviewData.productId);

      return {
        success: true,
        review,
        message: 'Review submitted successfully!'
      };
    } catch (error) {
      console.error('Error creating review:', error);
      return {
        success: false,
        error: error.message || 'Failed to create review'
      };
    }
  }

  /**
   * Get reviews for a product
   */
  static async getProductReviews(productId, filters = {}) {
    try {
      const { 
        rating, 
        sortBy = 'newest',
        limit = 10,
        page = 1,
        verifiedOnly = false
      } = filters;

      let query = { 
        productId,
        status: 'approved' 
      };

      if (rating) query.rating = rating;
      if (verifiedOnly) query.isVerifiedPurchase = true;

      const skip = (page - 1) * limit;

      const reviews = await Review.find(query)
        .sort(this._getSortOption(sortBy))
        .skip(skip)
        .limit(limit)
        .select('-userEmail -userId'); // Don't expose email/ID

      const total = await Review.countDocuments(query);

      return {
        success: true,
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      console.error('Error getting reviews:', error);
      return {
        success: false,
        error: error.message,
        reviews: []
      };
    }
  }

  /**
   * Get review stats for product
   */
  static async getReviewStats(productId) {
    try {
      const stats = await Review.aggregate([
        {
          $match: { 
            productId,
            status: 'approved'
          }
        },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: '$rating' },
                  totalReviews: { $sum: 1 }
                }
              }
            ],
            byRating: [
              {
                $group: {
                  _id: '$rating',
                  count: { $sum: 1 }
                }
              },
              {
                $sort: { _id: -1 }
              }
            ],
            verifiedReviews: [
              {
                $match: { isVerifiedPurchase: true }
              },
              {
                $count: 'count'
              }
            ],
            withPhotos: [
              {
                $match: { 'photos.0': { $exists: true } }
              },
              {
                $count: 'count'
              }
            ]
          }
        }
      ]);

      const result = stats[0];

      return {
        averageRating: result.overall[0]?.averageRating || 0,
        totalReviews: result.overall[0]?.totalReviews || 0,
        ratingDistribution: result.byRating.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        verifiedReviewCount: result.verifiedReviews[0]?.count || 0,
        photosCount: result.withPhotos[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
        verifiedReviewCount: 0,
        photosCount: 0
      };
    }
  }

  /**
   * Mark review as helpful
   */
  static async markHelpful(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        return { success: false, error: 'Review not found' };
      }

      // Remove from unhelpful if was there
      review.userHelpfulVotes.push(userId);
      review.helpfulCount += 1;

      await review.save();

      return {
        success: true,
        helpfulCount: review.helpfulCount
      };
    } catch (error) {
      console.error('Error marking helpful:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's review for a product
   */
  static async getUserReview(productId, userId) {
    try {
      const review = await Review.findOne({ productId, userId });
      return review;
    } catch (error) {
      console.error('Error getting user review:', error);
      return null;
    }
  }

  /**
   * Edit review (only by owner)
   */
  static async editReview(reviewId, userId, updateData) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        return { success: false, error: 'Review not found' };
      }

      if (review.userId !== userId) {
        return { success: false, error: 'Not authorized to edit this review' };
      }

      // Allow editing title, text, rating, photos
      if (updateData.rating) review.rating = updateData.rating;
      if (updateData.title) review.title = updateData.title;
      if (updateData.text) review.text = updateData.text;
      if (updateData.photos) review.photos = updateData.photos;

      review.updatedAt = new Date();
      await review.save();

      // Recalculate product rating
      await this.updateProductRating(review.productId);

      return {
        success: true,
        review,
        message: 'Review updated successfully!'
      };
    } catch (error) {
      console.error('Error editing review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete review (only by owner or admin)
   */
  static async deleteReview(reviewId, userId, isAdmin = false) {
    try {
      const review = await Review.findById(reviewId);

      if (!review) {
        return { success: false, error: 'Review not found' };
      }

      if (!isAdmin && review.userId !== userId) {
        return { success: false, error: 'Not authorized to delete this review' };
      }

      const productId = review.productId;
      await Review.findByIdAndDelete(reviewId);

      // Recalculate product rating
      await this.updateProductRating(productId);

      return {
        success: true,
        message: 'Review deleted successfully!'
      };
    } catch (error) {
      console.error('Error deleting review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update product rating based on reviews
   * @private
   */
  static async updateProductRating(productId) {
    try {
      const stats = await this.getReviewStats(productId);
      // Store rating on product document for faster queries
      // This depends on your Product model implementation
      return stats;
    } catch (error) {
      console.error('Error updating product rating:', error);
    }
  }

  /**
   * Get sort option object
   * @private
   */
  static _getSortOption(sortBy) {
    switch (sortBy) {
      case 'helpful':
        return { helpfulCount: -1 };
      case 'highest':
        return { rating: -1 };
      case 'lowest':
        return { rating: 1 };
      case 'newest':
      default:
        return { createdAt: -1 };
    }
  }

  /**
   * Get top reviews (for featured display)
   */
  static async getTopReviews(productId, limit = 3) {
    try {
      // Prioritize: verified + photos + helpful + recent
      return await Review.find({
        productId,
        status: 'approved'
      })
      .sort({
        isVerifiedPurchase: -1,
        'photos.0': { $exists: true } ? -1 : 1,
        helpfulCount: -1,
        createdAt: -1
      })
      .limit(limit);
    } catch (error) {
      console.error('Error getting top reviews:', error);
      return [];
    }
  }

  /**
   * Moderate reviews (admin only)
   */
  static async moderateReview(reviewId, status, notes = '') {
    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          status, // 'approved', 'rejected'
          moderatorNotes: notes,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (status === 'approved') {
        await this.updateProductRating(review.productId);
      }

      return {
        success: true,
        review,
        message: `Review ${status}!`
      };
    } catch (error) {
      console.error('Error moderating review:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  Review,
  ReviewService
};

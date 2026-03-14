/**
 * Recommendation Controller
 * Handles personalized product recommendations
 */

const { RecommendationService } = require('../services/recommendationService');

class RecommendationController {
  /**
   * Get similar products
   * GET /api/recommendations/similar/:productId
   */
  static async getSimilarProducts(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const result = await RecommendationService.getSimilarProducts(
        parseInt(productId),
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch similar products'
      });
    }
  }

  /**
   * Get frequently bought together
   * GET /api/recommendations/frequently-bought/:productId
   */
  static async getFrequentlyBoughtTogether(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 3 } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const result = await RecommendationService.getFrequentlyBoughtTogether(
        parseInt(productId),
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getFrequentlyBoughtTogether:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch frequently bought together'
      });
    }
  }

  /**
   * Get trending products
   * GET /api/recommendations/trending
   */
  static async getTrendingProducts(req, res) {
    try {
      const { limit = 10, days = 7 } = req.query;

      const result = await RecommendationService.getTrendingProducts(
        parseInt(limit),
        parseInt(days)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getTrendingProducts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch trending products'
      });
    }
  }

  /**
   * Get personalized recommendations (protected)
   * GET /api/recommendations/personalized
   */
  static async getPersonalizedRecommendations(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const { limit = 8 } = req.query;

      const result = await RecommendationService.getPersonalizedRecommendations(
        userId,
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch personalized recommendations'
      });
    }
  }

  /**
   * Get seasonal recommendations
   * GET /api/recommendations/seasonal
   */
  static async getSeasonalRecommendations(req, res) {
    try {
      const { limit = 6 } = req.query;

      const result = await RecommendationService.getSeasonalRecommendations(
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in getSeasonalRecommendations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch seasonal recommendations'
      });
    }
  }

  /**
   * Track product view
   * POST /api/recommendations/view-tracking
   */
  static async trackProductView(req, res) {
    try {
      const { productId, timeSpent = 0 } = req.body;
      const userId = req.user?.id || req.body.userId || 'anonymous';

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
      }

      const result = await RecommendationService.trackRecentView(
        userId,
        parseInt(productId),
        parseInt(timeSpent)
      );

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in trackProductView:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to track product view'
      });
    }
  }

  /**
   * Track purchase (log for frequently bought together)
   * POST /api/recommendations/track-purchase
   * Called from order completion
   */
  static async trackPurchase(req, res) {
    try {
      const { orderItems } = req.body; // Array of {productId, quantity}

      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order items are required'
        });
      }

      // Track pairs for frequently bought together
      for (let i = 0; i < orderItems.length; i++) {
        for (let j = i + 1; j < orderItems.length; j++) {
          await RecommendationService.trackPurchase(
            orderItems[i].productId,
            orderItems[j].productId
          );
        }
      }

      return res.json({
        success: true,
        message: 'Purchase tracked for recommendations'
      });
    } catch (error) {
      console.error('Error in trackPurchase:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to track purchase'
      });
    }
  }

  /**
   * Get recommendation engine stats (admin)
   * GET /api/recommendations/admin/stats
   */
  static async getRecommendationStats(req, res) {
    try {
      const stats = await RecommendationService.getRecommendationStats();

      return res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error in getRecommendationStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recommendation stats'
      });
    }
  }
}

module.exports = RecommendationController;

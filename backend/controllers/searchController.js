/**
 * Search Controller
 * Handles advanced product search with filters and analytics
 */

const { SearchService } = require('../services/searchService');

class SearchController {
  /**
   * Search products
   * GET /api/search
   * Query params: q=query, category, minPrice, maxPrice, rating, inStock, skinType, tags, sortBy, page, limit
   */
  static async searchProducts(req, res) {
    try {
      const {
        q = '',
        category,
        minPrice,
        maxPrice,
        rating,
        inStock,
        skinType,
        tags,
        sortBy = 'relevance',
        page = 1,
        limit = 12
      } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters'
        });
      }

      const filters = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: rating ? parseFloat(rating) : undefined,
        inStock: inStock === 'true',
        skinType,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const result = await SearchService.search(
        q.trim(),
        filters,
        sortBy,
        {
          limit: Math.min(parseInt(limit) || 12, 50),
          page: Math.max(parseInt(page) || 1, 1)
        }
      );

      // Log search for analytics
      if (result.success && result.results.length === 0) {
        SearchService.logSearch(q.trim(), 'no-results');
      } else if (result.success) {
        SearchService.logSearch(q.trim(), 'found');
      }

      return res.json(result);
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return res.status(500).json({
        success: false,
        error: 'Search failed'
      });
    }
  }

  /**
   * Get search suggestions (autocomplete)
   * GET /api/search/suggestions
   * Query params: q=partial
   */
  static async getSuggestions(req, res) {
    try {
      const { q = '', limit = 5 } = req.query;

      if (q.length < 1) {
        return res.json({
          success: true,
          suggestions: []
        });
      }

      const result = await SearchService.getSuggestions(q.trim(), parseInt(limit));

      return res.json({
        success: true,
        suggestions: result
      });
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch suggestions'
      });
    }
  }

  /**
   * Get available filter options
   * GET /api/search/filter-options
   */
  static async getFilterOptions(req, res) {
    try {
      const options = await SearchService.getFilterOptions();

      return res.json({
        success: true,
        filters: options
      });
    } catch (error) {
      console.error('Error in getFilterOptions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch filter options'
      });
    }
  }

  /**
   * Get popular searches
   * GET /api/search/popular
   */
  static async getPopularSearches(req, res) {
    try {
      const { limit = 10 } = req.query;

      const popular = await SearchService.getPopularSearches(parseInt(limit));

      return res.json({
        success: true,
        popularSearches: popular
      });
    } catch (error) {
      console.error('Error in getPopularSearches:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch popular searches'
      });
    }
  }

  /**
   * Get search analytics (admin)
   * GET /api/search/admin/analytics
   */
  static async getSearchAnalytics(req, res) {
    try {
      const { days = 30 } = req.query;

      const analytics = await SearchService.getSearchAnalytics(parseInt(days));

      return res.json({
        success: true,
        analytics
      });
    } catch (error) {
      console.error('Error in getSearchAnalytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch search analytics'
      });
    }
  }

  /**
   * Advanced filters metadata
   * GET /api/search/metadata
   */
  static async getSearchMetadata(req, res) {
    try {
      const metadata = {
        sortOptions: [
          { id: 'relevance', label: 'Most Relevant' },
          { id: 'newest', label: 'Newest' },
          { id: 'price-asc', label: 'Price: Low to High' },
          { id: 'price-desc', label: 'Price: High to Low' },
          { id: 'rating', label: 'Top Rated' },
          { id: 'popularity', label: 'Most Popular' }
        ],
        priceRanges: [
          { min: 0, max: 500, label: 'Under PKR 500' },
          { min: 500, max: 1000, label: 'PKR 500 - 1,000' },
          { min: 1000, max: 2000, label: 'PKR 1,000 - 2,000' },
          { min: 2000, max: 5000, label: 'PKR 2,000 - 5,000' },
          { min: 5000, max: 999999, label: 'Above PKR 5,000' }
        ],
        skinTypes: [
          'Sensitive',
          'Dry',
          'Oily',
          'Combination',
          'Normal',
          'All Skin Types'
        ],
        categories: [
          'Bath Bombs',
          'Bath Salts',
          'Soaps',
          'Skincare',
          'Gift Sets'
        ]
      };

      return res.json({
        success: true,
        metadata
      });
    } catch (error) {
      console.error('Error in getSearchMetadata:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch search metadata'
      });
    }
  }
}

module.exports = SearchController;

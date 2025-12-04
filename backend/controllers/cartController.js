/**
 * Enhanced Cart Controller
 * Handles cart operations with pricing, tax, shipping
 */

const CartService = require('../services/cartService');

class CartController {
  /**
   * Calculate cart total
   * POST /api/cart/calculate
   */
  static async calculateTotal(req, res) {
    try {
      const { items, shippingMethod = 'standard', couponCode } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart items are required'
        });
      }

      const result = await CartService.calculateCartTotal(
        items,
        shippingMethod,
        couponCode
      );

      return res.json(result);
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate total'
      });
    }
  }

  /**
   * Validate coupon code
   * POST /api/cart/validate-coupon
   */
  static async validateCoupon(req, res) {
    try {
      const { couponCode } = req.body;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code is required'
        });
      }

      const result = await CartService.validateCoupon(couponCode);

      return res.json(result);
    } catch (error) {
      console.error('Error validating coupon:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate coupon'
      });
    }
  }

  /**
   * Get available coupons
   * GET /api/cart/coupons
   */
  static async getAvailableCoupons(req, res) {
    try {
      const coupons = CartService.getAvailableCoupons();

      return res.json({
        success: true,
        coupons
      });
    } catch (error) {
      console.error('Error getting coupons:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch coupons'
      });
    }
  }

  /**
   * Get shipping methods
   * GET /api/cart/shipping-methods
   */
  static async getShippingMethods(req, res) {
    try {
      const methods = CartService.getShippingMethods();

      return res.json({
        success: true,
        methods
      });
    } catch (error) {
      console.error('Error getting shipping methods:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch shipping methods'
      });
    }
  }

  /**
   * Calculate bulk discount
   * POST /api/cart/bulk-discount
   */
  static async calculateBulkDiscount(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Items array is required'
        });
      }

      const discount = CartService.calculateBulkDiscount(items);

      return res.json({
        success: true,
        discount
      });
    } catch (error) {
      console.error('Error calculating bulk discount:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate bulk discount'
      });
    }
  }

  /**
   * Get installment options
   * POST /api/cart/installments
   */
  static async getInstallmentOptions(req, res) {
    try {
      const { totalAmount } = req.body;

      if (totalAmount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Total amount is required'
        });
      }

      const installments = CartService.getInstallmentOptions(parseFloat(totalAmount));

      return res.json({
        success: true,
        installments
      });
    } catch (error) {
      console.error('Error getting installment options:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate installments'
      });
    }
  }

  /**
   * Estimate delivery date
   * POST /api/cart/estimate-delivery
   */
  static async estimateDelivery(req, res) {
    try {
      const { shippingMethod = 'standard' } = req.body;

      const estimate = CartService.estimateDeliveryDate(shippingMethod);

      return res.json({
        success: true,
        estimate
      });
    } catch (error) {
      console.error('Error estimating delivery:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to estimate delivery'
      });
    }
  }

  /**
   * Get cart summary (all pricing details)
   * POST /api/cart/summary
   */
  static async getCartSummary(req, res) {
    try {
      const { items, shippingMethod = 'standard', couponCode } = req.body;

      if (!items || items.length === 0) {
        return res.json({
          success: true,
          summary: {
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0,
            itemCount: 0
          }
        });
      }

      const calculation = await CartService.calculateCartTotal(
        items,
        shippingMethod,
        couponCode
      );

      if (!calculation.success) {
        return res.status(400).json(calculation);
      }

      const bulkDiscount = CartService.calculateBulkDiscount(items);
      const delivery = CartService.estimateDeliveryDate(shippingMethod);
      const installments = CartService.getInstallmentOptions(calculation.breakdown.total);

      return res.json({
        success: true,
        summary: {
          itemCount: items.length,
          ...calculation.breakdown,
          bulkDiscount,
          estimatedDelivery: delivery,
          installmentOptions: installments
        }
      });
    } catch (error) {
      console.error('Error getting cart summary:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cart summary'
      });
    }
  }
}

module.exports = CartController;

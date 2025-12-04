/**
 * Inventory Controller
 * Handles stock management, reservations, and alerts
 */

const mongoose = require('mongoose');
const { InventoryService } = require('../models/Inventory');

const ensureObjectId = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

class InventoryController {
  /**
   * Get inventory status for a product
   * GET /api/inventory/status/:productId
   */
  static async getInventoryStatus(req, res) {
    try {
      const { productId } = req.params;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId is required'
        });
      }

      const status = await InventoryService.getStockStatus(mongoProductId);

      return res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error('Error in getInventoryStatus:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory status'
      });
    }
  }

  /**
   * Check if product is in stock
   * GET /api/inventory/check/:productId
   */
  static async checkStock(req, res) {
    try {
      const { productId } = req.params;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId is required'
        });
      }

      const inStock = await InventoryService.isInStock(mongoProductId);
      const available = await InventoryService.getAvailableStock(mongoProductId);

      return res.json({
        success: true,
        inStock,
        availableQuantity: available
      });
    } catch (error) {
      console.error('Error in checkStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check stock'
      });
    }
  }

  /**
   * Reserve stock for cart
   * POST /api/inventory/reserve
   * Body: { productId, quantity, expiryMinutes }
   */
  static async reserveStock(req, res) {
    try {
      const { productId, quantity, expiryMinutes = 30 } = req.body;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId and quantity are required'
        });
      }

      const result = await InventoryService.reserveStock(
        mongoProductId,
        parseInt(quantity, 10),
        parseInt(expiryMinutes, 10)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in reserveStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reserve stock'
      });
    }
  }

  /**
   * Release stock reservation (when removing from cart)
   * POST /api/inventory/release
   * Body: { productId, quantity }
   */
  static async releaseStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId and quantity are required'
        });
      }

      const result = await InventoryService.releaseStock(
        mongoProductId,
        parseInt(quantity, 10)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in releaseStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to release stock'
      });
    }
  }

  /**
   * Deduct stock after order completion
   * POST /api/inventory/deduct
   * Body: { productId, quantity }
   * Internal use only
   */
  static async deductStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId and quantity are required'
        });
      }

      const result = await InventoryService.deductStock(
        mongoProductId,
        parseInt(quantity, 10)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in deductStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to deduct stock'
      });
    }
  }

  /**
   * Add stock (restock)
   * POST /api/inventory/add
   * Body: { productId, quantity }
   * Admin only
   */
  static async addStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId and quantity are required'
        });
      }

      const result = await InventoryService.addStock(
        mongoProductId,
        parseInt(quantity, 10)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in addStock:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add stock'
      });
    }
  }

  /**
   * Get low stock products
   * GET /api/inventory/low-stock
   * Admin only
   */
  static async getLowStockProducts(req, res) {
    try {
      const { limit = 20 } = req.query;

      const products = await InventoryService.getLowStockProducts(parseInt(limit, 10));

      return res.json({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error in getLowStockProducts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch low stock products'
      });
    }
  }

  /**
   * Get inventory dashboard summary
   * GET /api/inventory/summary
   * Admin only
   */
  static async getInventorySummary(req, res) {
    try {
      const summary = await InventoryService.getInventorySummary();

      return res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Error in getInventorySummary:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory summary'
      });
    }
  }

  /**
   * Get all inventory details
   * GET /api/inventory/all
   * Admin only
   */
  static async getAllInventory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Assuming MongoDB inventory collection
      const inventories = await InventoryService.getAllInventory(skip, parseInt(limit, 10));
      const total = await InventoryService.getTotalInventoryCount();

      return res.json({
        success: true,
        inventories,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (error) {
      console.error('Error in getAllInventory:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory'
      });
    }
  }

  /**
   * Initialize inventory for new product
   * POST /api/inventory/initialize
   * Admin only
   * Body: { productId, quantity, lowStockThreshold }
   */
  static async initializeInventory(req, res) {
    try {
      const { productId, quantity = 0, lowStockThreshold = 5 } = req.body;
      const mongoProductId = ensureObjectId(productId);

      if (!mongoProductId) {
        return res.status(400).json({
          success: false,
          error: 'Valid productId is required'
        });
      }

      const result = await InventoryService.initializeInventory(
        mongoProductId,
        parseInt(quantity, 10),
        parseInt(lowStockThreshold, 10)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in initializeInventory:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize inventory'
      });
    }
  }

  /**
   * Bulk update inventory
   * POST /api/inventory/bulk-update
   * Admin only
   * Body: { updates: [{ productId, quantity, action: 'set'|'add'|'subtract' }] }
   */
  static async bulkUpdateInventory(req, res) {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Updates array is required'
        });
      }

      const results = [];
      for (const update of updates) {
        const mongoProductId = ensureObjectId(update.productId);
        if (!mongoProductId) {
          results.push({ success: false, error: 'Invalid productId' });
          continue;
        }
        let result;
        if (update.action === 'set') {
          // Set inventory
          result = await InventoryService.setInventory(mongoProductId, update.quantity);
        } else if (update.action === 'add') {
          result = await InventoryService.addStock(mongoProductId, update.quantity);
        } else if (update.action === 'subtract') {
          result = await InventoryService.deductStock(mongoProductId, update.quantity);
        }
        results.push(result);
      }

      return res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error in bulkUpdateInventory:', error);
      return res.status(500).json({
        success: false,
        error: 'Bulk update failed'
      });
    }
  }

  /**
   * Get stock alerts
   * GET /api/inventory/alerts
   * Admin only
   */
  static async getStockAlerts(req, res) {
    try {
      const { type = 'all', limit = 50 } = req.query;

      const alerts = await InventoryService.getStockAlerts(type, parseInt(limit, 10));

      return res.json({
        success: true,
        alerts
      });
    } catch (error) {
      console.error('Error in getStockAlerts:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch alerts'
      });
    }
  }
}

module.exports = InventoryController;

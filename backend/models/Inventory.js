/**
 * Real-Time Inventory Management System
 * Features:
 * - Live stock updates
 * - Low-stock alerts
 * - Inventory tracking
 * - Stock reservation for cart items
 */

const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reserved: {
    type: Number,
    default: 0, // Items in carts
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  restockLevel: {
    type: Number,
    default: 20
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'discontinued'],
    default: 'in-stock'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const StockAlertSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['low-stock', 'out-of-stock', 'restocked', 'high-demand'],
    required: true
  },
  message: String,
  acknowledged: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days
  }
});

const Inventory = mongoose.model('Inventory', InventorySchema);
const StockAlert = mongoose.model('StockAlert', StockAlertSchema);

class InventoryService {
  /**
   * Check available stock (quantity - reserved)
   */
  static async getAvailableStock(productId) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) return 0;
      return Math.max(0, inventory.quantity - inventory.reserved);
    } catch (error) {
      console.error('Error getting available stock:', error);
      return 0;
    }
  }

  /**
   * Check if product is in stock
   */
  static async isInStock(productId, quantity = 1) {
    const available = await this.getAvailableStock(productId);
    return available >= quantity;
  }

  /**
   * Get inventory status with display text
   */
  static async getStockStatus(productId) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) return { status: 'unknown', text: 'Stock info unavailable' };

      const available = Math.max(0, inventory.quantity - inventory.reserved);

      if (inventory.status === 'discontinued') {
        return { status: 'discontinued', text: 'Discontinued' };
      }
      if (inventory.quantity === 0) {
        return { status: 'out-of-stock', text: 'Out of Stock', available: 0 };
      }
      if (available < inventory.lowStockThreshold) {
        return { 
          status: 'low-stock', 
          text: `Only ${available} left!`, 
          available,
          urgency: 'high'
        };
      }
      if (available < 10) {
        return { 
          status: 'low-stock', 
          text: `${available} items available`, 
          available,
          urgency: 'medium'
        };
      }
      return { status: 'in-stock', text: 'In Stock', available };
    } catch (error) {
      console.error('Error getting stock status:', error);
      return { status: 'error', text: 'Stock unavailable' };
    }
  }

  /**
   * Reserve stock for cart item (reservation expires in 30 mins)
   * Used for session-based cart reservation
   */
  static async reserveStock(productId, quantity, expiryMinutes = 30) {
    try {
      const available = await this.getAvailableStock(productId);
      
      if (available < quantity) {
        return {
          success: false,
          error: `Only ${available} items available`,
          available
        };
      }

      await Inventory.findOneAndUpdate(
        { productId },
        {
          $inc: { reserved: quantity },
          updatedAt: new Date()
        },
        { upsert: true }
      );

      // Set expiry timer (implementation depends on your system)
      setTimeout(() => {
        this.releaseReservation(productId, quantity);
      }, expiryMinutes * 60 * 1000);

      return { success: true, reservedUntil: expiryMinutes };
    } catch (error) {
      console.error('Error reserving stock:', error);
      return { success: false, error: 'Failed to reserve stock' };
    }
  }

  /**
   * Release reserved stock (when cart item removed or order fails)
   */
  static async releaseReservation(productId, quantity) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (inventory) {
        await Inventory.findOneAndUpdate(
          { productId },
          {
            $inc: { reserved: -quantity },
            updatedAt: new Date()
          }
        );
      }
      return true;
    } catch (error) {
      console.error('Error releasing reservation:', error);
      return false;
    }
  }

  /**
   * Backwards compatible alias for releaseReservation
   */
  static async releaseStock(productId, quantity) {
    return this.releaseReservation(productId, quantity);
  }

  /**
   * Set inventory to an exact quantity (admin bulk updates)
   */
  static async setInventory(productId, quantity) {
    try {
      const result = await Inventory.findOneAndUpdate(
        { productId },
        {
          $set: { quantity, updatedAt: new Date() },
          $max: { restockLevel: quantity }
        },
        { new: true, upsert: true }
      );
      return { success: true, inventory: result };
    } catch (error) {
      console.error('Error setting inventory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deduct stock after successful order
   */
  static async deductStock(productId, quantity) {
    try {
      const result = await Inventory.findOneAndUpdate(
        { productId },
        {
          $inc: { quantity: -quantity, reserved: -quantity },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (result) {
        // Check if now low stock
        await this._checkLowStockAlert(productId, result);
      }

      return true;
    } catch (error) {
      console.error('Error deducting stock:', error);
      return false;
    }
  }

  /**
   * Add stock (restock)
   */
  static async addStock(productId, quantity, notes = '') {
    try {
      const result = await Inventory.findOneAndUpdate(
        { productId },
        {
          $inc: { quantity: quantity },
          lastRestocked: new Date(),
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );

      // Create restocked alert
      await new StockAlert({
        productId,
        alertType: 'restocked',
        message: `Product restocked: +${quantity} units. ${notes}`
      }).save();

      return result;
    } catch (error) {
      console.error('Error adding stock:', error);
      return null;
    }
  }

  /**
   * Get low stock products (for admin)
   */
  static async getLowStockProducts(limit = 20) {
    try {
      return await Inventory.find({
        $expr: { $lt: ['$quantity', '$lowStockThreshold'] },
        status: { $ne: 'discontinued' }
      })
      .sort({ quantity: 1 })
      .limit(limit);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  static async getAllInventory(skip = 0, limit = 20) {
    try {
      return Inventory.find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error getting inventory list:', error);
      return [];
    }
  }

  static async getTotalInventoryCount() {
    try {
      return Inventory.countDocuments();
    } catch (error) {
      console.error('Error counting inventory:', error);
      return 0;
    }
  }

  /**
   * Get inventory summary for dashboard
   */
  static async getInventorySummary() {
    try {
      const summary = await Inventory.aggregate([
        {
          $facet: {
            totalProducts: [
              { $count: 'count' }
            ],
            totalQuantity: [
              { $group: { _id: null, total: { $sum: '$quantity' } } }
            ],
            lowStockCount: [
              { $match: { $expr: { $lt: ['$quantity', '$lowStockThreshold'] } } },
              { $count: 'count' }
            ],
            outOfStockCount: [
              { $match: { quantity: 0 } },
              { $count: 'count' }
            ]
          }
        }
      ]);

      return {
        totalProducts: summary[0].totalProducts[0]?.count || 0,
        totalQuantity: summary[0].totalQuantity[0]?.total || 0,
        lowStockCount: summary[0].lowStockCount[0]?.count || 0,
        outOfStockCount: summary[0].outOfStockCount[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return null;
    }
  }

  /**
   * Initialize inventory for new product
   */
  static async initializeInventory(productId, quantity = 0, lowStockThreshold = 5) {
    try {
      const inventory = new Inventory({
        productId,
        quantity,
        lowStockThreshold,
        restockLevel: Math.max(quantity, 20)
      });
      await inventory.save();
      return inventory;
    } catch (error) {
      console.error('Error initializing inventory:', error);
      return null;
    }
  }

  /**
   * Create low stock alert
   * @private
   */
  static async _checkLowStockAlert(productId, inventory) {
    try {
      if (inventory.quantity < inventory.lowStockThreshold && inventory.quantity > 0) {
        // Check if alert already exists
        const existingAlert = await StockAlert.findOne({
          productId,
          alertType: 'low-stock',
          createdAt: { $gte: new Date(Date.now() - 3600000) } // Last 1 hour
        });

        if (!existingAlert) {
          await new StockAlert({
            productId,
            alertType: 'low-stock',
            message: `Product ${productId} low stock: ${inventory.quantity} remaining`
          }).save();
        }
      }
    } catch (error) {
      console.error('Error checking low stock alert:', error);
    }
  }

  /**
   * Get stock alerts for admin
   */
  static async getStockAlerts(type = 'all', limit = 50) {
    try {
      const query = { acknowledged: false };
      if (type !== 'all') {
        query.alertType = type;
      }
      return await StockAlert.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting stock alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge stock alert
   */
  static async acknowledgeAlert(alertId) {
    try {
      await StockAlert.findByIdAndUpdate(alertId, { acknowledged: true });
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }
}

module.exports = {
  Inventory,
  StockAlert,
  InventoryService
};

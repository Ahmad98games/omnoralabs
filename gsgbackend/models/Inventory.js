const { createModel } = require('../utils/modelFactory');

const inventorySchema = {
  productId: { type: String, required: true, unique: true, index: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  lastRestocked: { type: Date, default: Date.now },
  restockLevel: { type: Number, default: 20 },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'discontinued'],
    default: 'in-stock'
  }
};

const alertSchema = {
  productId: { type: String, required: true, index: true },
  alertType: {
    type: String,
    enum: ['low-stock', 'out-of-stock', 'restocked', 'high-demand'],
    required: true
  },
  message: String,
  acknowledged: { type: Boolean, default: false }
};

const Inventory = createModel('Inventory', inventorySchema);
const StockAlert = createModel('StockAlert', alertSchema);

class InventoryService {
  // ... logic remains high-level enough to work with the abstracted models
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

  static async isInStock(productId, quantity = 1) {
    const available = await this.getAvailableStock(productId);
    return available >= quantity;
  }

  static async getStockStatus(productId) {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) return { status: 'unknown', text: 'Stock info unavailable' };
      const available = Math.max(0, inventory.quantity - inventory.reserved);
      if (inventory.status === 'discontinued') return { status: 'discontinued', text: 'Discontinued' };
      if (inventory.quantity === 0) return { status: 'out-of-stock', text: 'Out of Stock', available: 0 };
      if (available < inventory.lowStockThreshold) return { status: 'low-stock', text: `Only ${available} left!`, available, urgency: 'high' };
      return { status: 'in-stock', text: 'In Stock', available };
    } catch (error) {
      return { status: 'error', text: 'Stock unavailable' };
    }
  }

  static async reserveStock(productId, quantity, expiryMinutes = 30) {
    try {
      const available = await this.getAvailableStock(productId);
      if (available < quantity) return { success: false, error: `Only ${available} items available`, available };
      await Inventory.findOneAndUpdate({ productId }, { $inc: { reserved: quantity } }, { upsert: true });
      setTimeout(() => { this.releaseReservation(productId, quantity); }, expiryMinutes * 60 * 1000);
      return { success: true, reservedUntil: expiryMinutes };
    } catch (error) {
      return { success: false, error: 'Failed' };
    }
  }

  static async releaseReservation(productId, quantity) {
    try {
      await Inventory.findOneAndUpdate({ productId }, { $inc: { reserved: -quantity } });
      return true;
    } catch (error) { return false; }
  }

  static async deductStock(productId, quantity) {
    try {
      const result = await Inventory.findOneAndUpdate({ productId }, { $inc: { quantity: -quantity, reserved: -quantity } }, { new: true });
      if (result) await this._checkLowStockAlert(productId, result);
      return true;
    } catch (error) { return false; }
  }

  static async _checkLowStockAlert(productId, inventory) {
    if (inventory.quantity < inventory.lowStockThreshold && inventory.quantity > 0) {
      await StockAlert.create({ productId, alertType: 'low-stock', message: `Low stock alert for ${productId}` });
    }
  }
}

module.exports = { Inventory, StockAlert, InventoryService };

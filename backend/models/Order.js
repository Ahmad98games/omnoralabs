const { createModel } = require('../utils/modelFactory');

const schema = {
  user: { type: String }, // Stored as string for compatibility
  orderNumber: { type: String, unique: true },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: String
    }
  },
  items: [{
    product: { type: String },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['INITIATED', 'pending', 'receipt_submitted', 'approved', 'processing', 'shipped', 'delivered', 'rejected', 'cancelled', 'whatsapp_initiated'],
    default: 'INITIATED'
  },
  paymentMethod: { type: String, default: 'cod' },
  paymentProof: { type: String },
  shippingFee: { type: Number, default: 0 }
};

const hooks = {
  save: async function (next) {
    if (!this.orderNumber) {
      // For LocalDB, we need a stable count. 
      // Fortunately countDocuments is now on the constructor (mapped via context for LocalDB)
      // or we can use Date.now() + random suffix which is safer
      const randomSuffix = Math.floor(Math.random() * 1000);
      this.orderNumber = `ORD${Date.now()}${randomSuffix}`;
    }
    next();
  }
};

module.exports = createModel('Order', schema, { hooks });
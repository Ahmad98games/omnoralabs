const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestCustomer: {
    name: String,
    email: String,
    phone: String
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  billingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card', 'bank_transfer', 'payoneer', 'meezan', 'jazzcash', 'easypaisa']
  },
  paymentProof: {
    userAgent: String
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String
}, {
  timestamps: true
});

// Generate Order Number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
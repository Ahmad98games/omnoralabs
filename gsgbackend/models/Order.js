const { createModel } = require('../utils/modelFactory');

const schema = {
  sellerId: { type: String, index: true },          // multi-tenant scoping
  user: { type: String },
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
    enum: ['PENDING_CONFIRMATION', 'INITIATED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING_CONFIRMATION'
  },

  // ── Payment tracking ─────────────────────────────────────────────────────
  paymentMethod: { type: String, default: 'cod' },      // cod | bank_transfer | easypaisa | jazzcash | stripe
  paymentStatus: {                                       // financial state
    type: String,
    enum: ['pending', 'verified', 'rejected', 'refunded'],
    default: 'pending'
  },
  verificationStatus: {                                  // manual review state
    type: String,
    enum: ['unverified', 'receipt_uploaded', 'approved', 'rejected'],
    default: 'unverified'
  },
  partialPaidAmount: { type: Number, default: 0 },      // for partial COD scenarios
  paymentNotes: { type: String, default: '' },     // seller notes on payment
  paymentProof: { type: String },                  // uploaded receipt URL

  shippingFee: { type: Number, default: 0 },
  auditTrail: [{
    statusChange: String,
    actorName: String,
    actorId: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
};

const hooks = {
  save: async function (next) {
    if (!this.orderNumber) {
      // Professional unique ID: OS - (last 6 digits of timestamp) - (4 random digits)
      // This allows for 9000 orders per millisecond without collision (roughly)
      const ts = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      this.orderNumber = `OS-${ts}-${randomSuffix}`;
    }
    next();
  }
};

module.exports = createModel('Order', schema, { hooks });
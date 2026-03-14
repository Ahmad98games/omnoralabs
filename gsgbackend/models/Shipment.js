const { createModel } = require('../utils/modelFactory');

const schema = {
    sellerId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    provider: { type: String, required: true, enum: ['leopards', 'tcs', 'trax', 'manual'] },
    trackingNumber: { type: String },
    status: {
        type: String,
        default: 'booked',
        enum: ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'attempted', 'returned', 'cancelled']
    },
    providerResponse: { type: Object },  // raw API response stored for debugging
    lastSyncAt: { type: Date },
    events: [{
        status: String,
        location: String,
        note: String,
        timestamp: { type: Date, default: Date.now }
    }],
};

module.exports = createModel('Shipment', schema);

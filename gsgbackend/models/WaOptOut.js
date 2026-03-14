const { createModel } = require('../utils/modelFactory');

const schema = {
    phone: { type: String, required: true, index: true },
    sellerId: { type: String, required: true },           // scoped per seller
    optedOutAt: { type: Date, default: Date.now },
    reason: { type: String, default: 'STOP keyword' }, // 'STOP keyword' | 'manual'
    reinstated: { type: Boolean, default: false },        // seller can re-enable manually
    reinstatedAt: { type: Date },
};

module.exports = createModel('WaOptOut', schema, {
    indexes: [{ fields: { phone: 1, sellerId: 1 }, options: { unique: true } }]
});

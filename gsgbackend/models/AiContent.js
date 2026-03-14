const { createModel } = require('../utils/modelFactory');

const schema = {
    sellerId: { type: String, required: true, index: true },
    type: { type: String, required: true }, // 'hero-headline' | 'product-description' | 'about-us' | 'promo-banner'
    language: { type: String, default: 'english' }, // 'english' | 'urdu' | 'roman-urdu'
    length: { type: String, default: 'medium' },  // 'short' | 'medium' | 'full'
    contextHash: { type: String, required: true },      // SHA of input context — dedup key
    prompt: { type: String },
    result: { type: String },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'done', 'failed'] },
    errorMsg: { type: String },
    regeneratedAt: { type: Date },
};

module.exports = createModel('AiContent', schema, {
    indexes: [{ fields: { sellerId: 1, type: 1, contextHash: 1 }, options: { unique: true } }]
});

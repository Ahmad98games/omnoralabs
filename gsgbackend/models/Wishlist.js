const { createModel } = require('../utils/modelFactory');

const schema = {
  userId: { type: String, required: true, unique: true, index: true },
  items: [{
    productId: { type: String, required: true },
    productName: String,
    price: Number,
    image: String,
    addedAt: { type: Date, default: Date.now }
  }]
};

module.exports = {
  Wishlist: createModel('Wishlist', schema)
};

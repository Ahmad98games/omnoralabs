const { createModel } = require('../utils/modelFactory');

const schema = {
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  category: { type: String, required: true, index: true },
  image: { type: String, required: true },
  images: [String],
  isFeatured: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
};

const indexes = [
  { fields: { name: 'text', description: 'text', category: 'text' } }
];

module.exports = createModel('Product', schema, { indexes });
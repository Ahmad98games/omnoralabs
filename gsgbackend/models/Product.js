const { createModel } = require('../utils/modelFactory');

const schema = {
  seller: { type: String, required: true, index: true }, // Ownership reference
  tenant_id: { type: String, required: true, index: true, default: 'default_tenant' }, // ISO Isolation
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
  isBestseller: { type: Boolean, default: false }, // Conversion Booster
  showLowStockWarning: { type: Boolean, default: true }, // Conversion Booster
  variants: [{
    label: { type: String, required: true }, // e.g., "Size: M", "Color: Black"
    priceOverride: { type: Number }, // Optional price change for this variant
    stock: { type: Number, default: 0 }
  }],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
};

const indexes = [
  { fields: { name: 'text', description: 'text', category: 'text' } }
];

module.exports = createModel('Product', schema, { indexes });
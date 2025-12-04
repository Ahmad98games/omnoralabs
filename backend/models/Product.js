const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000
    },
    image: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },
    isNew: {
      type: Boolean,
      default: false,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    inventoryCount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      required: true,
      default: 100,
      min: 0
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for available stock
ProductSchema.virtual('availableStock').get(function () {
  return this.stock - this.reservedStock;
});

// Indexes
ProductSchema.index({ category: 1, isFeatured: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Pre-save hook
ProductSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
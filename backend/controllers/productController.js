const mongoose = require('mongoose');
const Product = require('../models/Product');
const logger = require('../services/logger');
const defaultProducts = require('../data/defaultProducts');

const buildFilters = (query) => {
  const filters = {};
  if (query.category) {
    filters.category = query.category.toLowerCase();
  }
  if (typeof query.isFeatured !== 'undefined') {
    filters.isFeatured = query.isFeatured === true || query.isFeatured === 'true';
  }
  if (typeof query.isNew !== 'undefined') {
    filters.isNew = query.isNew === true || query.isNew === 'true';
  }
  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }
  if (query.search) {
    filters.$text = { $search: query.search };
  }
  return filters;
};

const getSortOrder = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    default:
      return { createdAt: -1 };
  }
};

/**
 * @desc    Get all products with pagination and filters
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);
    const sort = getSortOrder(req.query.sort);

    // Initial seed if empty
    const count = await Product.countDocuments();
    if (count === 0) {
      logger.info('Database/LocalDB is empty, seeding with default products');
      for (const p of defaultProducts) {
        await Product.create({
          ...p,
          isFeatured: p.featured || false
        });
      }
    }

    const productsSelection = await Product.find(filters).sort(sort).skip(skip).limit(limit);
    const total = await Product.countDocuments(filters);

    res.json({
      success: true,
      data: productsSelection,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching products', { error: error.message });
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error fetching product', {
      error: error.message,
      productId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Unable to fetch product.'
    });
  }
};

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ category }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments({ category })
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    logger.error('Error fetching products by category', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
    const newArrivals = await Product.find({ isNew: true })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: newArrivals });
  } catch (error) {
    logger.error('Error fetching new arrivals', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 4, 50);
    const featuredProducts = await Product.find({ isFeatured: true })
      .limit(limit);

    res.json({ success: true, data: featuredProducts });
  } catch (error) {
    logger.error('Error fetching featured products', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query is required.' });
    }

    const results = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).limit(50);

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching products', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * @desc    Create product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, image, isFeatured, isNew } = req.body;

    const payload = {
      name,
      description,
      price: Number(price),
      stock: Number(stock), // Explicitly handle stock
      category: category.toLowerCase(),
      image,
      isFeatured: isFeatured === true || isFeatured === 'true',
      isNew: isNew === true || isNew === 'true',
      reservedStock: 0 // Initialize reserved stock
    };

    if (payload.price < 0 || payload.stock < 0) {
      return res.status(400).json({ success: false, error: 'Price and stock cannot be negative.' });
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Error creating product', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Unable to create product.'
    });
  }
};

/**
 * @desc    Update product (Admin only)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res) => {
  try {
    // 1. Find the product first (Explicitly)
    let product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Update failed: Product not found', { id: req.params.id });
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    // 2. Validate and Apply Updates Manually
    const { name, description, price, stock, category, image, isFeatured, isNew } = req.body;

    // Apply updates directly to the document object
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category.toLowerCase();
    if (image) product.image = image;

    // Boolean flags - explicit check to allow filtering 'false'
    if (isFeatured !== undefined) product.isFeatured = isFeatured === true || isFeatured === 'true';
    if (isNew !== undefined) product.isNew = isNew === true || isNew === 'true';

    // Numbers
    if (price !== undefined) {
      const p = Number(price);
      if (p < 0) return res.status(400).json({ success: false, error: 'Price cannot be negative' });
      product.price = p;
    }
    if (stock !== undefined) {
      const s = Number(stock);
      if (s < 0) return res.status(400).json({ success: false, error: 'Stock cannot be negative' });
      product.stock = s;
    }

    // 3. Save using the instance method (more reliable in mocks)
    await product.save();

    logger.info('Product updated successfully', { id: product._id });
    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Error updating product', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Unable to update product.'
    });
  }
};

/**
 * @desc    Delete product (Admin only)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }
    res.json({
      success: true,
      message: 'Product deleted.'
    });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Unable to delete product.'
    });
  }
};
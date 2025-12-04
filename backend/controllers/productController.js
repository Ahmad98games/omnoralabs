const mongoose = require('mongoose');
const Product = require('../models/Product');
const logger = require('../services/logger');
const defaultProducts = require('../data/defaultProducts');

// Check if MongoDB is connected
const isMongoDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

const mapDefaultProduct = (p) => ({
  ...p,
  isFeatured: p.featured || false,
  isNew: false,
  _id: p._id // Ensure ID is preserved
});

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
    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      logger.warn('MongoDB not connected, using default products');
      const mappedProducts = defaultProducts.map(mapDefaultProduct);
      return res.json({
        success: true,
        data: mappedProducts,
        pagination: {
          page: 1,
          limit: mappedProducts.length,
          total: mappedProducts.length,
          pages: 1
        }
      });
    }

    // Check if database is empty and seed it
    const count = await Product.countDocuments();
    if (count === 0) {
      logger.info('Database is empty, seeding with default products');
      const productsToSeed = defaultProducts.map(p => ({
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        isFeatured: p.featured || false,
        isNew: false,
        inventoryCount: 100
      }));
      await Product.insertMany(productsToSeed);
      logger.info(`Seeded ${productsToSeed.length} products`);
    }

    const page = parseInt(req.query.page, 10) || 1;
    // Allow fetching all products if limit is high or not specified (default 12)
    // But user wants to change concept. Let's allow limit=0 or limit=1000
    let limit = parseInt(req.query.limit, 10) || 12;
    if (limit > 100) limit = 100; // Cap at 100 still for safety, but maybe user wants more?
    // If user passes limit=100, they get 100.

    const skip = (page - 1) * limit;

    const filters = buildFilters(req.query);
    const sort = getSortOrder(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filters).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filters)
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
    logger.error('Error fetching products', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // CONSISTENT fallback response
    const mappedProducts = defaultProducts.map(mapDefaultProduct);
    res.status(200).json({
      success: true,
      data: mappedProducts,
      pagination: {
        page: 1,
        limit: mappedProducts.length,
        total: mappedProducts.length,
        pages: 1
      },
      fallback: true
    });
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

    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      const product = defaultProducts.find(p => p._id === id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found.'
        });
      }
      return res.json({ success: true, data: mapDefaultProduct(product) });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product id.'
      });
    }

    const product = await Product.findById(id).lean();
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

    // Try fallback on error
    const product = defaultProducts.find(p => p._id === req.params.id);
    if (product) {
      return res.json({ success: true, data: mapDefaultProduct(product), fallback: true });
    }

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

    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      const filtered = defaultProducts.filter(p => p.category === category).map(mapDefaultProduct);
      return res.json({
        success: true,
        data: filtered,
        pagination: {
          page: 1,
          limit: filtered.length,
          total: filtered.length,
          pages: 1
        }
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 100);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ category }).skip(skip).limit(limit).lean(),
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
    logger.error('Error fetching products by category', {
      error: error.message,
      category: req.params.category
    });

    // CONSISTENT fallback
    const category = req.params.category.toLowerCase();
    const filtered = defaultProducts.filter(p => p.category === category).map(mapDefaultProduct);

    res.status(200).json({
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: filtered.length,
        total: filtered.length,
        pages: 1
      },
      fallback: true
    });
  }
};

/**
 * @desc    Get new arrivals
 * @route   GET /api/products/new-arrivals
 * @access  Public
 */
exports.getNewArrivals = async (req, res) => {
  try {
    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      return res.json({
        success: true,
        data: defaultProducts.slice(0, 3).map(mapDefaultProduct)
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
    const newArrivals = await Product.find({ isNew: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: newArrivals });
  } catch (error) {
    logger.error('Error fetching new arrivals', { error: error.message });
    res.json({
      success: true,
      data: defaultProducts.slice(0, 3).map(mapDefaultProduct),
      fallback: true
    });
  }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      const featured = defaultProducts.filter(p => p.featured).map(mapDefaultProduct);
      return res.json({ success: true, data: featured });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 4, 50);
    const featuredProducts = await Product.find({ isFeatured: true })
      .limit(limit)
      .lean();

    res.json({ success: true, data: featuredProducts });
  } catch (error) {
    logger.error('Error fetching featured products', { error: error.message });
    const featured = defaultProducts.filter(p => p.featured).map(mapDefaultProduct);
    res.json({
      success: true,
      data: featured,
      fallback: true
    });
  }
};

/**
 * @desc    Search products
 * @route   GET /api/products/search?q=query
 * @access  Public
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required.'
      });
    }

    // Use in-memory fallback if MongoDB is not connected
    if (!isMongoDBConnected()) {
      const results = defaultProducts.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase())
      ).map(mapDefaultProduct);
      return res.json({ success: true, data: results });
    }

    const results = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).limit(50).lean();

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching products', {
      error: error.message,
      query: req.query.q
    });

    const { q } = req.query;
    const results = defaultProducts.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.description.toLowerCase().includes(q.toLowerCase())
    ).map(mapDefaultProduct);

    res.json({
      success: true,
      data: results,
      fallback: true
    });
  }
};

/**
 * @desc    Create product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      category: req.body.category.toLowerCase()
    };
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
    const updates = { ...req.body };
    if (updates.category) {
      updates.category = updates.category.toLowerCase();
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

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
// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('../services/logger');
const defaultProducts = require('../data/defaultProducts');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildFilters = (query, tenantId, supabaseQuery) => {
  const targetId = uuidRegex.test(tenantId) ? tenantId : null;
  let q = supabaseQuery.eq('merchant_id', targetId || '00000000-0000-0000-0000-000000000000'); // Use NIL UUID if non-merchant

  if (query.category) {
    q = q.eq('product_type', query.category); // Mapping category to product_type
  }
  if (typeof query.isFeatured !== 'undefined') {
    const isFeatured = query.isFeatured === true || query.isFeatured === 'true';
    if (isFeatured) q = q.eq('status', 'active'); // Mocking featured via active for now or status
  }
  
  if (query.minPrice) q = q.gte('base_price', Number(query.minPrice));
  if (query.maxPrice) q = q.lte('base_price', Number(query.maxPrice));
  
  if (query.search) {
    q = q.ilike('title', `%${query.search}%`);
  }
  return q;
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

    let supabaseQuery = supabase.from('products').select('*', { count: 'exact' });
    supabaseQuery = buildFilters(req.query, req.tenantId, supabaseQuery);
    
    // Sorting
    const sort = req.query.sort || 'newest';
    if (sort === 'price_asc') supabaseQuery = supabaseQuery.order('base_price', { ascending: true });
    else if (sort === 'price_desc') supabaseQuery = supabaseQuery.order('base_price', { ascending: false });
    else supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

    const { data: products, count: total, error } = await supabaseQuery
      .range(skip, skip + limit - 1);

    if (error) throw error;

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

    const targetId = uuidRegex.test(req.tenantId) ? req.tenantId : '00000000-0000-0000-0000-000000000000';
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', targetId)
      .maybeSingle();

    if (error) throw error;
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

    const { data: products, count: total, error } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('product_type', category)
      .eq('merchant_id', req.tenantId || '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

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
    const { data: newArrivals, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', req.tenantId || '00000000-0000-0000-0000-000000000000')
      .eq('status', 'active') // Mocking isNew via status=active for now or can use created_at
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, data: newArrivals });
  } catch (error) {
    logger.error('Error fetching new arrivals', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getFeaturedProducts = async (req, res) => {
  try {
    const { data: featuredProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', req.tenantId || '00000000-0000-0000-0000-000000000000')
      .eq('status', 'active')
      .limit(limit);

    if (error) throw error;
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

    const { data: results, error } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', req.tenantId || '00000000-0000-0000-0000-000000000000')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,product_type.ilike.%${q}%`)
      .limit(50);

    if (error) throw error;
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
    const { name, description, price, stock, category, image, handle } = req.body;

    const targetId = uuidRegex.test(req.tenantId) ? req.tenantId : null;
    if (!targetId) return res.status(403).json({ error: 'Merchant Identity Required' });

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        merchant_id: targetId,
        title: name,
        description,
        handle: handle || name.toLowerCase().replace(/ /g, '-'),
        base_price: Number(price),
        inventory_count: Number(stock),
        product_type: category,
        featured_image: image,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
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
    const { name, description, price, stock, category, image, handle } = req.body;

    const updateData = {};
    if (name) updateData.title = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.base_price = Number(price);
    if (stock !== undefined) updateData.inventory_count = Number(stock);
    if (category) updateData.product_type = category;
    if (image) updateData.featured_image = image;
    if (handle) updateData.handle = handle;

    const targetId = uuidRegex.test(req.tenantId) ? req.tenantId : null;
    if (!targetId) return res.status(403).json({ error: 'Merchant Identity Required' });

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('merchant_id', targetId)
      .select()
      .single();

    if (error) {
      logger.warn('Update failed: Product not found or Unauthorized', { id: req.params.id, tenant: req.tenantId });
      return res.status(404).json({
        success: false,
        error: 'Product not found.'
      });
    }

    logger.info('Product updated successfully', { id: product.id });
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
    const targetId = uuidRegex.test(req.tenantId) ? req.tenantId : null;
    if (!targetId) return res.status(403).json({ error: 'Merchant Identity Required' });

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('merchant_id', targetId);

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or Unauthorized.'
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
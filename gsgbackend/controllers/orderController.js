// 🛑 Mongoose Removed. Using Supabase Backend Client
const { supabase } = require('../../backend/shared/lib/supabaseClient'); 
const logger = require('../services/logger');
const path = require('path');
const fs = require('fs');
const { queueEmail, queueWhatsApp } = require('../services/queueService');
const { sendOrderEmail } = require('../services/mailblusterService');
const { generateApprovalToken, verifyApprovalToken } = require('../utils/tokenService');
const { reserveStock, decrementStock, releaseStock, checkStock } = require('../utils/inventoryService');
const { validateEnv } = require('../config/env');
const { generateOrderHash } = require('../utils/orderHashService');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const config = validateEnv();

// ============================================
// STATUS TRANSITION VALIDATION
// ============================================

const VALID_TRANSITIONS = {
  'PENDING_CONFIRMATION': ['INITIATED', 'PROCESSING', 'CANCELLED'],
  'INITIATED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': [],
  'REFUNDED': []
};

function isValidTransition(currentStatus, newStatus) {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Record admin action in audit log
 */
async function recordAdminAction(orderId, adminEmail, action, ip, userAgent, details = {}) {
  try {
    const targetTenant = uuidRegex.test(details.tenantId) ? details.tenantId : null;
    if (!targetTenant) return; // Skip audit if no valid merchant context
    
    await supabase.from('interaction_logs').insert([{
      merchant_id: targetTenant,
      event_type: 'search', 
      metadata: { orderId, adminEmail, action, ip, userAgent, ...details }
    }]);
    logger.info('Admin action recorded via interaction_logs', { orderId, action, adminEmail });
  } catch (error) {
    logger.error('Failed to record admin action', { error: error.message });
  }
}

/**
 * Validate order data
 */
function validateOrder(orderData) {
  const { items, shippingAddress, paymentMethod, totalAmount } = orderData;

  if (!items || items.length === 0) {
    throw new Error('Order must contain items');
  }
  if (!shippingAddress) {
    throw new Error('Shipping address is required');
  }
  if (!paymentMethod) {
    throw new Error('Payment method is required');
  }
  if (!totalAmount || totalAmount <= 0) {
    throw new Error('Valid total amount is required');
  }
  return true;
}

// ============================================
// MAIN CONTROLLER FUNCTIONS
// ============================================

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Public (guest checkout allowed)
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      totalAmount,
      customerInfo
    } = req.body;

    // Validation
    validateOrder({ items, shippingAddress, paymentMethod, totalAmount });

    // Circuit Breaker: Fail fast if DB is down to prevent hanging
    const { isAvailable } = require('../services/queueService'); // Re-using availability check or direct import
    // Better: use stateService directly as imported
    const systemState = require('../services/stateService').getSnapshot();
    if (!systemState.infra.db) {
      logger.warn('Order rejected: Database unavailable');
      return res.status(503).json({
        success: false,
        error: 'System is currently in maintenance mode (Database Unavailable). Please try again later.'
      });
    }

    // Normalize items: frontend sends `productId`, backend expects `product` (ref: inventoryService.js)
    const normalizedItems = items.map(i => ({
      ...i,
      product: i.productId || i.product, // Handle both cases for robustness
      productId: i.productId || i.product
    }));

    // Check stock availability (but don't reserve yet for INITIATED orders)
    const stockCheck = await checkStock(normalizedItems);
    if (!stockCheck.inStock) {
      return res.status(400).json({
        success: false,
        error: 'Some items are out of stock',
        outOfStock: stockCheck.outOfStock
      });
    }

    // WhatsApp flow: All orders start as INITIATED (no stock reservation)
    // Create order in Supabase
    const targetTenant = uuidRegex.test(req.tenantId) ? req.tenantId : '00000000-0000-0000-0000-000000000000';
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        merchant_id: targetTenant,
        grand_total: totalAmount,
        financial_status: 'pending',
        fulfillment_status: 'unfulfilled',
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        customer_email: customerInfo?.email,
        customer_name: customerInfo?.name,
        payment_method: paymentMethod,
        metadata: { 
          source: req.body.source, 
          deviceType: req.body.deviceType, 
          userAgent: req.body.userAgentSnapshot,
          items: normalizedItems
        }
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const lineItems = normalizedItems.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      title: item.name || 'Product',
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(lineItems);

    if (itemsError) throw itemsError;

    logger.info('Order created in Supabase', { orderId: order.id });

    logger.info('Order hash generated', { orderId: order._id, orderHash });

    // NO stock reservation for INITIATED orders
    // NO email/WhatsApp notifications for INITIATED orders
    // User will be redirected to WhatsApp from frontend

    // Return full order object so frontend has all details for WhatsApp
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    logger.error('Create order error', { error: error.message });
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    logger.error('Get orders error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to user (or user is admin)
    if (order.customer_id && order.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Get order error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.metadata?.user_id && order.metadata.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate transition
    if (!isValidTransition(order.financial_status, 'cancelled')) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.financial_status}`
      });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        fulfillment_status: 'cancelled',
        metadata: { ...order.metadata, cancelledAt: new Date(), cancelReason: req.body.reason || 'Customer requested' }
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Release reserved stock
    try {
      await releaseStock(order.items);
      logger.info('Stock released for cancelled order', { orderId: order._id });
    } catch (stockError) {
      logger.error('Failed to release stock', { error: stockError.message });
    }

    // Queue WhatsApp notification
    try {
      const customerName = order.customer?.name || (req.user ? req.user.name : 'Customer');
      const phone = order.customer?.phone || (req.user ? req.user.phone : '');

        if (phone) {
        await queueWhatsApp(phone, 'order_cancelled', [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: order.orderNumber || order.id }
            ]
          }
        ], { orderId: order.id });
      }
    } catch (waError) {
      logger.error('Failed to queue WhatsApp cancellation', { error: waError.message });
    }

    // Queue Mailbluster Email
    try {
      await sendOrderEmail(order, 'OrderCancelled');
    } catch (mbError) {
      logger.error('Failed to send Mailbluster cancellation email', { error: mbError.message });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    logger.error('Cancel order error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

/**
 * @desc    Update order status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        fulfillment_status: status === 'shipped' ? 'fulfilled' : status, // Simple mapping
        metadata: { ...order.metadata, trackingNumber }
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Record admin action
    await recordAdminAction(
      order._id,
      req.user?.email || 'system',
      'update_status',
      req.ip,
      req.get('User-Agent'),
      { oldStatus, newStatus: status, trackingNumber }
    );

    // Queue WhatsApp notification for status changes
    try {
      const customerName = order.customer?.name || 'Customer';
      const phone = order.customer?.phone || '';

      if (phone) {
        if (status === 'shipped' && trackingNumber) {
          await queueWhatsApp(phone, 'order_shipped', [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName },
                { type: "text", text: order.orderNumber || order.id },
                { type: "text", text: trackingNumber }
              ]
            }
          ], { orderId: order.id });
        } else if (status === 'delivered') {
          await queueWhatsApp(phone, 'order_delivered', [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName },
                { type: "text", text: order.orderNumber || order.id }
              ]
            }
          ], { orderId: order.id });
        }
      }
    } catch (waError) {
      logger.error('Failed to queue WhatsApp status notification', { error: waError.message });
    }

    // Queue Mailbluster Email
    try {
      if (status === 'shipped') {
        await sendOrderEmail(order, 'OrderShipped');
      } else if (status === 'delivered') {
        await sendOrderEmail(order, 'OrderDelivered');
      }
    } catch (mbError) {
      logger.error('Failed to send Mailbluster status email', { error: mbError.message });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    logger.error('Update status error', { error: error.message });
    res.status(500).json({ error: 'Failed to update status' });
  }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, merchants(display_name, email)') // Equivalent to populate
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    logger.error('Get all orders error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * @desc    Upload payment proof with magic byte validation
 * @route   POST /api/orders/:id/receipt
 * @access  Public (rate limited)
 */
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent duplicate uploads
    if (order.financial_status === 'paid' || order.metadata?.isApproved) {
      return res.status(400).json({ error: 'Receipt already submitted or order approved' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No payment proof file uploaded' });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        metadata: { 
          ...order.metadata, 
          paymentProof: req.file.path, 
          paymentProofFilename: req.file.filename,
          approvalToken: generateApprovalToken(order.id, 'approve', config.services.adminEmail, req.ip),
          approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Queue email to admin for approval
    const approvalLink = `${config.frontendUrl}/admin/approve-order/${order.id}?token=${order.metadata?.approvalToken}`;

    await queueEmail('approval_request', {
      order: order,
      receiptPath: req.file.path,
      approvalLink,
      orderId: order.id,
      priority: 1
    });

    logger.info('Receipt uploaded and approval email queued', { orderId: order.id, filename: req.file.filename });

    res.json({
      success: true,
      message: 'Receipt uploaded successfully. Please wait for approval.',
      paymentProof: order.paymentProof
    });
  } catch (error) {
    logger.error('Upload payment proof error', { error: error.message });
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
};

/**
 * @desc    Approve order with secure token cleanup and audit logging
 * @route   GET /api/orders/:id/approve
 * @access  Public (rate limited, token protected)
 */
exports.approveOrder = async (req, res) => {
  try {
    const { token } = req.query;

    // Verify JWT token with strict validation
    const decoded = verifyApprovalToken(token, req.params.id);
    if (!decoded) {
      logger.warn('Invalid JWT approval token attempt', {
        orderId: req.params.id,
        ip: req.ip
      });
      return res.status(400).send('<h1>Invalid or expired approval token</h1>');
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        financial_status: 'paid',
        fulfillment_status: 'fulfilled', // or PROCESSING
        metadata: { 
          isApproved: true,
          approvedAt: new Date(),
          approvalToken: null,
          approvalTokenExpires: null
        }
      })
      .eq('id', req.params.id)
      .eq('metadata->>approvalToken', token) // Use JSON path if token is in metadata
      .select()
      .single();

    if (error || !order) {
      return res.status(400).send('<h1>Unable to approve order or order already approved</h1>');
    }

    // Decrement stock after approval
    try {
      await decrementStock(order.items);
      logger.info('Stock decremented for approved order', { orderId: order._id });
    } catch (stockError) {
      logger.error('Failed to decrement stock', { error: stockError.message });
    }

    // Record admin action
    await recordAdminAction(
      order._id,
      decoded.adminEmail,
      'approve',
      req.ip,
      req.get('User-Agent'),
      { orderNumber: order.orderNumber, totalAmount: order.totalAmount }
    );

    logger.info('Order approved', { orderId: order._id, ip: req.ip });

    // Queue confirmation emails
    try {
      await queueEmail('order_confirmation', {
        order: order.toObject(),
        orderId: order._id,
        priority: 2
      });

      await queueEmail('payment_approved', {
        order: order.toObject(),
        orderId: order._id,
        priority: 2
      });
    } catch (emailError) {
      logger.error('Failed to queue approval emails', { error: emailError.message });
    }

    // Queue WhatsApp Notification
    try {
      const customerName = order.customer?.name || 'Customer';
      const phone = order.customer?.phone || '';

      if (phone) {
        await queueWhatsApp(
          phone,
          "order_approved",
          [{
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: order.orderNumber || order._id.toString() },
              { type: "text", text: order.totalAmount.toLocaleString() },
              { type: "text", text: "3-5 business days" }
            ]
          }],
          { orderId: order._id, priority: 2 }
        );
      }
    } catch (waError) {
      logger.error('Failed to queue WhatsApp approval notification', { error: waError.message });
    }

    // Queue Mailbluster Email
    try {
      await sendOrderEmail(order, 'PaymentApproved');
    } catch (mbError) {
      logger.error('Failed to send Mailbluster approval email', { error: mbError.message });
    }

    res.send('<h1>Order Approved Successfully!</h1><p>The customer has been notified.</p>');
  } catch (error) {
    logger.error('Approve order error', { error: error.message });
    res.status(500).send('<h1>Failed to approve order</h1>');
  }
};

/**
 * @desc    Reject order with audit logging
 * @route   GET /api/orders/:id/reject
 * @access  Public (rate limited, token protected)
 */
exports.rejectOrder = async (req, res) => {
  try {
    const { token } = req.query;

    // Verify JWT token
    const decoded = verifyApprovalToken(token, req.params.id);
    if (!decoded) {
      logger.warn('Invalid JWT rejection token attempt', {
        orderId: req.params.id,
        ip: req.ip
      });
      return res.status(400).send('<h1>Invalid or expired token</h1>');
    }

    const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();

    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    if (!order.metadata?.approvalToken || order.metadata.approvalToken !== token) {
      return res.status(403).send('<h1>Invalid or expired token</h1>');
    }

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        fulfillment_status: 'cancelled',
        metadata: { 
          isApproved: false,
          rejectedAt: new Date(),
          approvalToken: null,
          approvalTokenExpires: null
        }
      })
      .eq('id', order.id);

    // Release reserved stock
    try {
      await releaseStock(order.items);
      logger.info('Stock released for rejected order', { orderId: order._id });
    } catch (stockError) {
      logger.error('Failed to release stock', { error: stockError.message });
    }

    // Record admin action
    await recordAdminAction(
      order._id,
      decoded.adminEmail,
      'reject',
      req.ip,
      req.get('User-Agent'),
      { orderNumber: order.orderNumber, totalAmount: order.totalAmount }
    );

    logger.info('Order rejected', { orderId: order._id });

    res.send('<h1>Order Rejected</h1><p>The order status has been updated to rejected.</p>');
  } catch (error) {
    logger.error('Reject order error', { error: error.message });
    res.status(500).send('<h1>Failed to reject order</h1>');
  }
};

/**
 * @desc    Get receipt file securely (private file serving)
 * @route   GET /api/orders/:id/receipt
 * @access  Private (Admin or Order Owner only)
 */
exports.getReceipt = async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order || !order.metadata?.paymentProof) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Authorization check
    if (order.customer_id && req.user && order.customer_id !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Unauthorized receipt access attempt', {
        orderId: order.id,
        attemptedBy: req.user.id,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Not authorized to access this receipt' });
    }

    const absolutePath = path.resolve(order.metadata.paymentProof);

    if (!fs.existsSync(absolutePath)) {
      logger.error('Receipt file not found on disk', {
        orderId: order.id,
        path: absolutePath
      });
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    const filename = order.metadata.paymentProofFilename || path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('Receipt accessed', {
      orderId: order.id,
      accessedBy: req.user?.id || 'unknown',
      ip: req.ip
    });

    res.sendFile(absolutePath);
  } catch (error) {
    logger.error('Get receipt error', { error: error.message });
    res.status(500).json({ error: 'Failed to get receipt' });
  }
};
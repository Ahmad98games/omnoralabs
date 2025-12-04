const logger = require('../services/logger');
const Order = require('../models/Order');
const AdminActionLog = require('../models/AdminActionLog');
const path = require('path');
const fs = require('fs');
const { queueEmail, queueWhatsApp } = require('../services/queueService');
const { sendOrderEmail } = require('../services/mailblusterService');
const { generateApprovalToken, verifyApprovalToken } = require('../utils/tokenService');
const { reserveStock, decrementStock, releaseStock, checkStock } = require('../utils/inventoryService');

// ============================================
// STATUS TRANSITION VALIDATION
// ============================================

const VALID_TRANSITIONS = {
  'pending': ['approved', 'rejected', 'cancelled'],
  'pending_admin_approval': ['approved', 'rejected', 'cancelled'],
  'receipt_submitted': ['approved', 'rejected', 'cancelled'],
  'approved': ['processing', 'shipped', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'cancelled'],
  'delivered': [], // Terminal state
  'rejected': [], // Terminal state
  'cancelled': [] // Terminal state
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
    await AdminActionLog.create({
      action,
      orderId,
      adminEmail,
      ip,
      userAgent,
      details
    });
    logger.info('Admin action recorded', { orderId, action, adminEmail });
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

    // Check stock availability
    const stockCheck = await checkStock(items);
    if (!stockCheck.inStock) {
      return res.status(400).json({
        success: false,
        error: 'Some items are out of stock',
        outOfStock: stockCheck.outOfStock
      });
    }

    // Determine initial status
    let initialStatus = 'pending';
    let paymentStatus = 'unpaid';
    let isApproved = false;

    if (paymentMethod === 'cod') {
      initialStatus = 'approved';
      paymentStatus = 'pending';
      isApproved = true;
    } else {
      initialStatus = 'pending_admin_approval';
    }

    // Create order object
    const orderData = {
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      totalAmount,
      status: initialStatus,
      paymentStatus: paymentStatus,
      isApproved: isApproved
    };

    // Add user ID if authenticated, otherwise use customer info
    if (req.user) {
      orderData.user = req.user.id;
    } else if (customerInfo) {
      orderData.guestCustomer = {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      };
    }

    const order = await Order.create(orderData);
    logger.info('Order created', { orderId: order._id, status: initialStatus });

    // Reserve stock for non-COD orders
    if (paymentMethod !== 'cod') {
      try {
        await reserveStock(items);
        logger.info('Stock reserved for order', { orderId: order._id });
      } catch (stockError) {
        // If stock reservation fails, delete the order
        await Order.findByIdAndDelete(order._id);
        logger.error('Stock reservation failed, order deleted', {
          orderId: order._id,
          error: stockError.message
        });
        return res.status(400).json({
          success: false,
          error: stockError.message
        });
      }
    }

    // Handle Notifications based on Payment Method (QUEUE ONLY)
    if (paymentMethod === 'cod') {
      // COD Flow: Queue confirmation email
      try {
        await queueEmail('order_confirmation', {
          order: order.toObject(),
          orderId: order._id,
          priority: 3
        });
        logger.info('COD confirmation email queued', { orderId: order._id });
      } catch (queueError) {
        logger.error('Failed to queue COD confirmation', { error: queueError.message });
      }

      // Queue Mailbluster email
      try {
        await sendOrderEmail(order, 'OrderPlaced');
      } catch (mbError) {
        logger.error('Failed to send Mailbluster email', { error: mbError.message });
      }

      // Note: WhatsApp skipped for COD

    } else {
      // Non-COD Flow: Queue admin approval email
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@omnora.com';
        const adminIp = req.ip || 'unknown';

        // Generate signed JWT approval token with admin binding
        const approvalToken = generateApprovalToken(order._id, 'approve', adminEmail, adminIp);
        const approvalTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        order.approvalToken = approvalToken;
        order.approvalTokenExpires = approvalTokenExpires;
        await order.save();

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
        const approveLink = `${baseUrl}/api/orders/${order._id}/approve?token=${approvalToken}`;
        const rejectLink = `${baseUrl}/api/orders/${order._id}/reject?token=${approvalToken}`;

        await queueEmail('admin_new_order', {
          order: order.toObject(),
          approveLink,
          rejectLink,
          orderId: order._id,
          priority: 1 // High priority
        });

        logger.info('Admin approval email queued', { orderId: order._id, adminEmail });

      } catch (emailError) {
        logger.error('Failed to queue admin approval email', { error: emailError.message });
      }
    }

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
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to user (or user is admin)
    if (order.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate transition
    if (!isValidTransition(order.status, 'cancelled')) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}`
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || 'Customer requested cancellation';
    await order.save();

    // Release reserved stock
    try {
      await releaseStock(order.items);
      logger.info('Stock released for cancelled order', { orderId: order._id });
    } catch (stockError) {
      logger.error('Failed to release stock', { error: stockError.message });
    }

    // Queue WhatsApp notification
    try {
      const customerName = order.guestCustomer?.name || (req.user ? req.user.name : 'Customer');
      const phone = order.guestCustomer?.phone || (req.user ? req.user.phone : '');

      if (phone) {
        await queueWhatsApp(phone, 'order_cancelled', [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: order.orderNumber || order._id.toString() }
            ]
          }
        ], { orderId: order._id });
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate transition
    if (!isValidTransition(order.status, status)) {
      return res.status(400).json({
        error: `Invalid status transition: ${order.status} → ${status}`
      });
    }

    const oldStatus = order.status;
    order.status = status;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

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
      const customerName = order.guestCustomer?.name || 'Customer';
      const phone = order.guestCustomer?.phone || '';

      if (phone) {
        if (status === 'shipped' && trackingNumber) {
          await queueWhatsApp(phone, 'order_shipped', [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName },
                { type: "text", text: order.orderNumber || order._id.toString() },
                { type: "text", text: trackingNumber }
              ]
            }
          ], { orderId: order._id });
        } else if (status === 'delivered') {
          await queueWhatsApp(phone, 'order_delivered', [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName },
                { type: "text", text: order.orderNumber || order._id.toString() }
              ]
            }
          ], { orderId: order._id });
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
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent duplicate uploads
    if (order.status === 'receipt_submitted' || order.status === 'approved' || order.isApproved) {
      return res.status(400).json({ error: 'Receipt already submitted or order approved' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No payment proof file uploaded' });
    }

    order.paymentProof = req.file.path;
    order.paymentProofFilename = req.file.filename;
    order.status = 'receipt_submitted';

    // Generate secure approval token
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@omnora.com';
    order.approvalToken = generateApprovalToken(order._id, 'approve', adminEmail, req.ip);
    order.approvalTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await order.save();

    // Queue email to admin for approval
    const approvalLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/approve-order/${order._id}?token=${order.approvalToken}`;

    await queueEmail('approval_request', {
      order: order.toObject(),
      receiptPath: req.file.path,
      approvalLink,
      orderId: order._id,
      priority: 1
    });

    logger.info('Receipt uploaded and approval email queued', { orderId: order._id, filename: req.file.filename });

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

    // Atomic update to prevent race conditions (Idempotency)
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        approvalToken: token,
        isApproved: false
      },
      {
        $set: {
          isApproved: true,
          status: 'approved',
          paymentStatus: 'paid',
          approvalLog: {
            approvedAt: new Date(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        },
        $unset: {
          approvalToken: "",
          approvalTokenExpires: ""
        }
      },
      { new: true }
    );

    if (!order) {
      const existingOrder = await Order.findById(req.params.id);
      if (!existingOrder) {
        return res.status(404).send('<h1>Order not found</h1>');
      }
      if (existingOrder.isApproved) {
        return res.status(409).send('<h1>Order already approved</h1>');
      }
      return res.status(400).send('<h1>Unable to approve order</h1>');
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
      const customerName = order.guestCustomer?.name || 'Customer';
      const phone = order.guestCustomer?.phone || '';

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

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    if (!order.approvalToken || order.approvalToken !== token) {
      return res.status(403).send('<h1>Invalid or expired token</h1>');
    }

    // Update status to rejected
    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'rejected',
          isApproved: false
        },
        $unset: {
          approvalToken: "",
          approvalTokenExpires: ""
        }
      }
    );

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
    const order = await Order.findById(req.params.id);

    if (!order || !order.paymentProof) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Authorization check
    if (order.user && req.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Unauthorized receipt access attempt', {
        orderId: order._id,
        attemptedBy: req.user.id,
        ip: req.ip
      });
      return res.status(403).json({ error: 'Not authorized to access this receipt' });
    }

    const absolutePath = path.resolve(order.paymentProof);

    if (!fs.existsSync(absolutePath)) {
      logger.error('Receipt file not found on disk', {
        orderId: order._id,
        path: absolutePath
      });
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    const filename = order.paymentProofFilename || path.basename(absolutePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('Receipt accessed', {
      orderId: order._id,
      accessedBy: req.user?.id || 'unknown',
      ip: req.ip
    });

    res.sendFile(absolutePath);
  } catch (error) {
    logger.error('Get receipt error', { error: error.message });
    res.status(500).json({ error: 'Failed to get receipt' });
  }
};
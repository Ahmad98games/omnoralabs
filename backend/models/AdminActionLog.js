const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['approve', 'reject', 'update_status', 'login']
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    adminEmail: {
        type: String,
        required: true
    },
    ip: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AdminActionLog', adminActionLogSchema);

const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    recipientPhone: String,
    type: {
        type: String,
        enum: ['template', 'text', 'image', 'unknown'],
        default: 'template'
    },
    direction: {
        type: String,
        enum: ['outbound', 'inbound'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed', 'received'],
        default: 'sent'
    },
    content: mongoose.Schema.Types.Mixed,
    error: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MessageLog', messageLogSchema);

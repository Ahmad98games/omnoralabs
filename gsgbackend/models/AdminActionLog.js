const mongoose = require('mongoose');
const LocalDB = require('../utils/LocalDB');

const useMongo = !!process.env.MONGODB_URI;
let AdminActionLog;

if (useMongo) {
    const adminLogSchema = new mongoose.Schema({
        adminId: { type: String, required: true },
        adminName: String,
        action: { type: String, required: true },
        target: { type: String }, // e.g., 'Order #123'
        details: { type: Object },
        timestamp: { type: Date, default: Date.now }
    }, { timestamps: true });

    AdminActionLog = mongoose.models.AdminActionLog || mongoose.model('AdminActionLog', adminLogSchema);
} else {
    AdminActionLog = new LocalDB('admin_action_logs');
}

module.exports = AdminActionLog;

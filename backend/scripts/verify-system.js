#!/usr/bin/env node

/**
 * Verification Script for Order Approval System
 * Run: node scripts/verify-system.js
 */

// [Mongoose Removed] const mongoose = require('mongoose');
require('dotenv').config();

async function verifySystem() {
    console.log('\n🔍 OMNORA ORDER APPROVAL SYSTEM - VERIFICATION\n');
    console.log('='.repeat(60));

    // 1. Check Environment Variables
    console.log('\n1️⃣  Checking Environment Variables...');
    const requiredEnvVars = [
        'APPROVAL_TOKEN_SECRET',
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
        'WHATSAPP_CLOUD_API_TOKEN',
        'WHATSAPP_PHONE_ID',
        'ADMIN_EMAIL',
        'SENDGRID_API_KEY'
    ];

    let envOk = true;
    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (!value || value.includes('placeholder') || value.includes('xxxxx')) {
            console.log(`   ❌ ${envVar}: MISSING or PLACEHOLDER`);
            envOk = false;
        } else {
            const masked = value.substring(0, 8) + '***';
            console.log(`   ✅ ${envVar}: ${masked}`);
        }
    }

    // 2. Check Token Secret Strength
    console.log('\n2️⃣  Checking APPROVAL_TOKEN_SECRET Strength...');
    const tokenSecret = process.env.APPROVAL_TOKEN_SECRET;
    if (tokenSecret && tokenSecret.length >= 32) {
        console.log(`   ✅ Token secret length: ${tokenSecret.length} chars (secure)`);
    } else {
        console.log(`   ❌ Token secret length: ${tokenSecret?.length || 0} chars (WEAK - need 32+)`);
        envOk = false;
    }

    // 3. Connect to MongoDB and Check Indexes
    console.log('\n3️⃣  Checking Database Indexes...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('   ✅ MongoDB connected');

        // [Mongoose Removed] const Order = require('../models/Order');
        // [Mongoose Removed] const AdminActionLog = require('../models/AdminActionLog');
        // [Mongoose Removed] const MessageLog = require('../models/MessageLog');

        // Check Order indexes
        const orderIndexes = await Order.collection.getIndexes();
        console.log('\n   📊 Order Indexes:');
        Object.keys(orderIndexes).forEach(key => {
            console.log(`      - ${key}`);
        });

        const hasStatusIndex = Object.keys(orderIndexes).some(k => k.includes('status'));
        const hasTokenIndex = Object.keys(orderIndexes).some(k => k.includes('approvalToken'));

        if (hasStatusIndex) console.log('   ✅ Status index exists');
        else console.log('   ⚠️  Status index missing (performance impact)');

        if (hasTokenIndex) console.log('   ✅ ApprovalToken index exists');
        else console.log('   ⚠️  ApprovalToken index missing (performance impact)');

        // Check AdminActionLog
        const actionLogCount = await AdminActionLog.countDocuments();
        console.log(`\n   📝 AdminActionLog entries: ${actionLogCount}`);
        if (actionLogCount > 0) {
            const latest = await AdminActionLog.findOne().sort({ timestamp: -1 });
            console.log(`      Latest action: ${latest.action} at ${latest.timestamp}`);
        }

        // Check MessageLog
        const messageLogCount = await MessageLog.countDocuments();
        console.log(`\n   💬 MessageLog entries: ${messageLogCount}`);

        await mongoose.disconnect();
        console.log('\n   ✅ Database checks complete');

    } catch (dbError) {
        console.log(`   ❌ Database error: ${dbError.message}`);
    }

    // 4. Test Token Generation
    console.log('\n4️⃣  Testing Token Generation...');
    try {
        const { generateApprovalToken, verifyApprovalToken } = require('../utils/tokenService');
        const testOrderId = '507f1f77bcf86cd799439011';
        const token = generateApprovalToken(testOrderId, 'approve', 'admin@test.com', '127.0.0.1');
        console.log(`   ✅ Token generated: ${token.substring(0, 20)}...`);

        const decoded = verifyApprovalToken(token, testOrderId);
        if (decoded && decoded.orderId === testOrderId) {
            console.log(`   ✅ Token verification: PASS`);
            console.log(`      Admin Email: ${decoded.adminEmail}`);
            console.log(`      Admin IP: ${decoded.adminIp}`);
            console.log(`      JTI: ${decoded.jti}`);
        } else {
            console.log(`   ❌ Token verification: FAIL`);
        }

        // Test tampered token
        const tamperedToken = token.slice(0, -5) + 'XXXXX';
        const tamperedResult = verifyApprovalToken(tamperedToken, testOrderId);
        if (!tamperedResult) {
            console.log(`   ✅ Tampered token rejected: PASS`);
        } else {
            console.log(`   ❌ Tampered token accepted: SECURITY RISK!`);
        }

    } catch (tokenError) {
        console.log(`   ❌ Token test error: ${tokenError.message}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 SUMMARY\n');
    if (envOk) {
        console.log('✅ All environment variables configured');
    } else {
        console.log('❌ Some environment variables need attention');
    }
    console.log('\n💡 Next Steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test COD order placement');
    console.log('   3. Test non-COD order → admin approval');
    console.log('   4. Verify WhatsApp template is approved in Meta');
    console.log('\n');
}

verifySystem().catch(console.error);

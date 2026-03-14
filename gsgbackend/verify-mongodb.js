const mongoose = require('mongoose');
const logger = require('./services/logger');

/**
 * MongoDB Connection Verification Script
 * 
 * This script checks if MongoDB is accessible and provides
 * helpful diagnostics if connection fails.
 */

async function verifyMongoConnection() {
    console.log('🔍 MongoDB Connection Verification\n');
    console.log('='.repeat(50));

    // Load environment variables
    require('dotenv').config();

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/omnora';
    console.log(`\n📍 Connection URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

    try {
        console.log('\n⏳ Attempting to connect...');

        const startTime = Date.now();
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });

        const duration = Date.now() - startTime;

        console.log(`\n✅ SUCCESS! Connected to MongoDB in ${duration}ms`);
        console.log(`\n📊 Connection Details:`);
        console.log(`   - Database: ${mongoose.connection.db.databaseName}`);
        console.log(`   - Host: ${mongoose.connection.host}`);
        console.log(`   - Port: ${mongoose.connection.port}`);
        console.log(`   - Ready State: ${mongoose.connection.readyState} (1 = connected)`);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📁 Collections (${collections.length}):`);
        if (collections.length === 0) {
            console.log('   - No collections yet (database is empty)');
        } else {
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed successfully');
        console.log('\n' + '='.repeat(50));
        console.log('✨ Your MongoDB setup is working correctly!');
        console.log('   You can now start your backend server.');
        console.log('='.repeat(50) + '\n');

        process.exit(0);

    } catch (error) {
        console.log(`\n❌ CONNECTION FAILED`);
        console.log(`\n🔴 Error: ${error.message}`);

        console.log('\n' + '='.repeat(50));
        console.log('💡 TROUBLESHOOTING GUIDE');
        console.log('='.repeat(50));

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n❌ MongoDB server is not running or not accessible\n');
            console.log('📋 Solutions:\n');
            console.log('   Option 1: Install MongoDB Locally');
            console.log('   ────────────────────────────────');
            console.log('   1. Download: https://www.mongodb.com/try/download/community');
            console.log('   2. Install as Windows Service');
            console.log('   3. MongoDB will start automatically\n');

            console.log('   Option 2: Use MongoDB Atlas (Cloud)');
            console.log('   ────────────────────────────────────');
            console.log('   1. Sign up: https://www.mongodb.com/cloud/atlas/register');
            console.log('   2. Create a free cluster');
            console.log('   3. Get connection string');
            console.log('   4. Update MONGODB_URI in .env file\n');

            console.log('   Option 3: Use In-Memory MongoDB (Testing Only)');
            console.log('   ───────────────────────────────────────────────');
            console.log('   1. Set USE_MEMORY_DB=true in .env');
            console.log('   2. Restart backend server');
            console.log('   ⚠️  Data will NOT persist after restart!\n');

        } else if (error.message.includes('authentication failed')) {
            console.log('\n❌ Authentication Failed\n');
            console.log('📋 Solutions:\n');
            console.log('   1. Check username and password in MONGODB_URI');
            console.log('   2. Verify user exists in MongoDB Atlas');
            console.log('   3. Check database access permissions\n');

        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
            console.log('\n❌ Network/DNS Issue\n');
            console.log('📋 Solutions:\n');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify MongoDB Atlas IP whitelist');
            console.log('   3. Check firewall settings\n');

        } else {
            console.log('\n❌ Unknown Error\n');
            console.log('📋 Next Steps:\n');
            console.log('   1. Check .env file exists and has MONGODB_URI');
            console.log('   2. Verify connection string format');
            console.log('   3. Check backend logs for more details\n');
        }

        console.log('='.repeat(50));
        console.log('📖 Full Documentation:');
        console.log('   See: implementation_plan.md in .gemini folder');
        console.log('='.repeat(50) + '\n');

        process.exit(1);
    }
}

// Run verification
verifyMongoConnection();

/* eslint-disable no-console */
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Database = require('better-sqlite3');
const Product = require('../models/Product');

const SQLITE_PATH = path.join(__dirname, '../data/ecommerce.db');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omnora_ecommerce';

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return Number(value) === 1;
};

const connectMongo = async () => {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
  console.log('✓ Connected to MongoDB');
};

const disconnectMongo = async () => {
  await mongoose.disconnect();
  console.log('✓ MongoDB disconnected');
};

const migrateProducts = async () => {
  console.log('⏳ Starting product migration...');
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  try {
    const rows = sqlite.prepare('SELECT * FROM products').all();
    if (!rows.length) {
      console.log('No products found in SQLite database.');
      return;
    }

    const operations = rows.map((row) => ({
      updateOne: {
        filter: { name: row.name.trim() },
        update: {
          $set: {
            name: row.name.trim(),
            price: Number(row.price) || 0,
            description: row.description,
            image: row.image,
            category: (row.category || 'uncategorized').toLowerCase(),
            isNew: normalizeBoolean(row.isNew),
            isFeatured: normalizeBoolean(row.isFeatured),
            createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
            updatedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await Product.bulkWrite(operations, { ordered: false });
    console.log(`✓ Migration completed. Upserts: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
  } finally {
    sqlite.close();
  }
};

(async () => {
  try {
    await connectMongo();
    await migrateProducts();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectMongo();
  }
})();


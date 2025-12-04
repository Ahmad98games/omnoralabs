const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');  // Now relative to backend/
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import routes (relative to backend/)
const productRoutes = require('./routes/productRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// Serve static files from root (for index.html, etc.)
app.use(express.static(path.join(__dirname, '../')));  // Serves from root (frontend/public)

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api', analyticsRoutes);  // Note: This catches /api/track, /api/events
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payments', paymentRoutes);

// Serve frontend build (if built)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Data import script
const importData = async () => {
  try {
    const Product = require('./models/Product');
    const fs = require('fs');

    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log('Products already exist. Skipping import.');
      return;
    }

    const dataPath = path.join(__dirname, '../../js/data.js');  // Adjust if data.js is in root/js
    if (!fs.existsSync(dataPath)) {
      console.log('data.js not found. Skipping. (Create it with sample products if needed.)');
      return;
    }

    const dataContent = fs.readFileSync(dataPath, 'utf8');
    const productsMatch = dataContent.match(/const products = ({[\s\S]*?});/);
    if (productsMatch && productsMatch[1]) {
      let productsObj;
      try {
        productsObj = JSON.parse(productsMatch[1]);
      } catch {
        productsObj = eval(`(${productsMatch[1]})`);  // Fallback (use cautiously)
      }

      const productsArray = [...(productsObj.collection || []), ...(productsObj.occasions || [])];
      const enhancedProducts = productsArray.map((product, index) => ({
        ...product,
        isNew: index < 8,
        isFeatured: index % 5 === 0
      }));

      await Product.insertMany(enhancedProducts);
      console.log('Products imported!');
    } else {
      console.log('No products in data.js');
    }
  } catch (error) {
    console.error('Import error:', error);
  }
};

importData();

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
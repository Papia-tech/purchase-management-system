const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const Product = require('./models/Product');
const { seedData } = require('./seed');

// Connect to Database & auto-initialize reference footwear dataset if empty
(async () => {
  try {
    await connectDB();
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Startup] No records found. Auto-populating The VERY FIRST Reference Dataset (Footwear / Shoes)...');
      await seedData('shoes');
      console.log('[Startup] Initial reference database ready!');
    }
  } catch (err) {
    console.error(`[Startup] Database initialization note: ${err.message}`);
  }
})();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Seed endpoint for convenience (POST or GET)
app.all('/api/seed', async (req, res) => {
  try {
    delete require.cache[require.resolve('./seed')];
    const { seedData: executeSeed } = require('./seed');
    const mode = req.body?.type || req.query?.type || 'shoes';
    const result = await executeSeed(mode);
    res.status(200).json({
      success: true,
      message: `Database seeded successfully (${result?.mode || mode} records)`,
      dataset: result?.mode || mode
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Root / Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'INVENTO API is healthy and running' });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] INVENTO Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };

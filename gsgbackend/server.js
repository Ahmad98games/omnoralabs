// ... existing imports (express, cors, etc.) ...

// 🛑 REMOVE those "BRIDGE JWT AUTH ROUTES" lines from server.js (approx lines 88-145)
// They are causing conflict with authRoutes.

// ---------- Routes ----------
const authRoutes = require('./routes/authRoutes');
// ... other routes ...

app.use('/api/auth', authRoutes); // This handles everything via the Controller we just fixed

// Global error handler - VERY IMPORTANT FOR VERCEL
app.use((err, req, res, next) => {
  res.status(500).json({ 
      error: "Imperial Server Error", 
      details: err.message 
  });
});

module.exports = app; // Export for Vercel
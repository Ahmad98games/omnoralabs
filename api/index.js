// api/index.js
// Vercel Serverless Bridge Execution
const app = require('../gsgbackend/server.js');

// Export the express app for Vercel's Edge Environment
module.exports = app;

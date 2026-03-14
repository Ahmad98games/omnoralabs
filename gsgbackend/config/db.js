const { validateEnv } = require('../config/env');
const dbService = require('../services/dbService');

const config = validateEnv();

/**
 * Legacy connectDB for backward compatibility.
 * Now uses the Singleton dbService.
 */
const connectDB = async () => {
  return dbService.connect(config.mongo.uri);
};

module.exports = connectDB;
const { validateEnv } = require('../config/env');
const dbService = require('../shared/lib/dbService');

const config = validateEnv();

/**
 * Legacy connectDB for backward compatibility.
 * Now uses the Singleton dbService.
 */
const connectDB = async () => {
  const promises = [];
  
  if (config.mongo.uri) {
    promises.push(dbService.connect(config.mongo.uri));
  }
  
  if (config.supabase.poolUrl) {
    promises.push(dbService.connectPostgres(config.supabase.poolUrl));
  }
  
  return Promise.all(promises);
};

module.exports = connectDB;
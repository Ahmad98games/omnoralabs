const LocalDB = require('./LocalDB');
const logger = require('../services/logger');

const useLocalOverride = process.env.USE_LOCAL_DB === 'true';
const useMongo = !!process.env.MONGODB_URI && !useLocalOverride;

/**
 * Creates a model that works with either MongoDB or LocalDB
 * @param {string} name - Model name (e.g. 'User')
 * @param {object} schemaDef - Mongoose-style schema definition
 * @param {object} options - Options including hooks and instance methods
 */
function createModel(name, schemaDef, options = {}) {
    if (useMongo) {
        // STRICT: Only require mongoose when mongo is active
        const mongoose = require('mongoose');

        // Check if model already exists to avoid OverwriteModelError
        if (mongoose.models[name]) return mongoose.models[name];

        const schema = new mongoose.Schema(schemaDef, {
            timestamps: true,
            ...options
        });

        // Register Pre-save Hooks
        if (options.hooks) {
            Object.entries(options.hooks).forEach(([event, fn]) => {
                schema.pre(event, fn);
            });
        }

        // Register Instance Methods
        if (options.methods) {
            Object.assign(schema.methods, options.methods);
        }

        // Add search index if specified in options
        if (options.indexes) {
            options.indexes.forEach(index => schema.index(index.fields, index.options));
        }

        return mongoose.model(name, schema);
    } else {
        // LOCAL DB MODE
        logger.info(`MODE: Initialize LocalDB for [${name}]`);
        const db = new LocalDB(name.toLowerCase(), schemaDef);

        // Register Hooks
        if (options.hooks) {
            Object.entries(options.hooks).forEach(([event, fn]) => {
                db.pre(event, fn);
            });
        }

        // Register Methods (via doc wrapping)
        if (options.methods) {
            db.instanceMethods = options.methods;
        }

        // --- CONSTRUCTOR SIMULATION ---
        function ModelConstructor(data = {}) {
            // Apply defaults
            const doc = { ...data };
            if (schemaDef) {
                for (const [key, config] of Object.entries(schemaDef)) {
                    if (doc[key] === undefined && config.default !== undefined) {
                        doc[key] = typeof config.default === 'function' ? config.default() : config.default;
                    }
                }
            }
            // Ensure ID
            if (!doc._id) doc._id = Math.random().toString(36).substr(2, 9);

            // Wrap to add .save(), .toObject(), etc.
            const wrapped = db._wrapDocument(doc);

            // Handle new instance "isNew" flag if needed (simplified)
            wrapped._isNew = true;

            return wrapped;
        }

        // Static Methods
        ModelConstructor.find = db.find.bind(db);
        ModelConstructor.findOne = db.findOne.bind(db);
        ModelConstructor.findById = db.findById.bind(db);
        ModelConstructor.create = db.create.bind(db);
        ModelConstructor.findOneAndUpdate = db.findOneAndUpdate.bind(db);
        ModelConstructor.findByIdAndUpdate = db.findByIdAndUpdate.bind(db);
        ModelConstructor.findByIdAndDelete = db.findByIdAndDelete.bind(db);
        ModelConstructor.countDocuments = db.countDocuments.bind(db);

        return ModelConstructor;
    }
}

module.exports = { createModel, useMongo };

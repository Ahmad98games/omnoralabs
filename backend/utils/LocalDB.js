const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');

class LocalDB {
    constructor(collectionName, schema = {}) {
        this.collectionName = collectionName;
        this.schema = schema;
        this.filePath = path.join(__dirname, `../data/${collectionName}.json`);
        this.data = [];
        this.hooks = { pre: {} };

        // Ensure data directory exists
        const dataDir = path.dirname(this.filePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Load data
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(raw || '[]');
                // Convert date strings back to Date objects
                this.data = this.data.map(item => this._deserialize(item));
            }
        } catch (error) {
            logger.error(`Failed to load local DB: ${this.collectionName}`, { error: error.message });
            this.data = [];
        }
    }

    _save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            logger.error(`Failed to save local DB: ${this.collectionName}`, { error: error.message });
        }
    }

    _deserialize(item) {
        // Broad date restoration for any field ending in "At" or "Date"
        Object.keys(item).forEach(key => {
            if ((key.endsWith('At') || key.endsWith('Date')) && item[key]) {
                const d = new Date(item[key]);
                if (!isNaN(d.getTime())) item[key] = d;
            }
        });
        return item;
    }

    // --- Mongoose-like API ---

    async create(doc) {
        const docData = { ...doc };

        // Apply Schema Defaults
        if (this.schema) {
            for (const [key, config] of Object.entries(this.schema)) {
                if (docData[key] === undefined && config.default !== undefined) {
                    docData[key] = typeof config.default === 'function' ? config.default() : config.default;
                }
            }
        }

        const newDoc = {
            _id: docData._id || Math.random().toString(36).substr(2, 9),
            ...docData,
            createdAt: docData.createdAt || new Date(),
            updatedAt: docData.updatedAt || new Date(),
            __v: 0
        };

        // Run pre-save hooks
        if (this.hooks.pre['save']) {
            await this.hooks.pre['save'].call(newDoc, () => { });
        }

        this.data.push(newDoc);
        this._save();
        return this._wrapDocument(newDoc);
    }

    _chain(resultOrPromise) {
        const chain = {
            promise: Promise.resolve(resultOrPromise),
            populate: () => chain,
            select: () => chain,
            lean: () => chain,
            sort: () => chain,
            then: (resolve, reject) => chain.promise.then(resolve, reject),
            catch: (reject) => chain.promise.catch(reject),
            finally: (cb) => chain.promise.finally(cb)
        };
        return chain;
    }

    find(query = {}) {
        let results = this.data.filter(item => this._matches(item, query));

        const chain = {
            results,
            sort: (criteria) => {
                if (!criteria) return chain;
                const entries = Object.entries(criteria);
                if (entries.length === 0) return chain;

                const [field, order] = entries[0];
                chain.results.sort((a, b) => {
                    const valA = a[field];
                    const valB = b[field];
                    if (valA < valB) return order === 1 ? -1 : 1;
                    if (valA > valB) return order === 1 ? 1 : -1;
                    return 0;
                });
                return chain;
            },
            skip: (count) => {
                chain.skipCount = count;
                return chain;
            },
            limit: (count) => {
                chain.limitCount = count;
                return chain;
            },
            populate: () => chain,
            select: () => chain,
            lean: () => chain,
            then: (resolve, reject) => {
                let finalResults = [...chain.results];
                if (chain.skipCount) finalResults = finalResults.slice(chain.skipCount);
                if (chain.limitCount) finalResults = finalResults.slice(0, chain.limitCount);
                // Return wrapped documents to allow .save()
                resolve(finalResults.map(d => this._wrapDocument(d)));
            }
        };
        return chain;
    }

    findById(id) {
        const doc = this.data.find(item => String(item._id) === String(id));
        return this._chain(doc ? this._wrapDocument(doc) : null);
    }

    findOne(query) {
        const doc = this.data.find(item => this._matches(item, query));
        return this._chain(doc ? this._wrapDocument(doc) : null);
    }

    updateOne(query, update) {
        const doc = this.data.find(item => this._matches(item, query));
        if (!doc) return this._chain({ n: 0, nModified: 0 });

        this._applyUpdate(doc, update);
        this._save();
        return this._chain({ n: 1, nModified: 1 });
    }

    findOneAndUpdate(query, update, options = {}) {
        let doc = this.data.find(item => this._matches(item, query));
        if (!doc) return this._chain(null);

        this._applyUpdate(doc, update);
        this._save();
        return this._chain(this._wrapDocument(doc));
    }

    findByIdAndUpdate(id, update, options = {}) {
        return this.findOneAndUpdate({ _id: id }, update, options);
    }

    findByIdAndDelete(id) {
        const index = this.data.findIndex(item => String(item._id) === String(id));
        if (index === -1) return this._chain(null);

        const [deletedDoc] = this.data.splice(index, 1);
        this._save();
        return this._chain(this._wrapDocument(deletedDoc));
    }

    async countDocuments(query = {}) {
        return this.data.filter(item => this._matches(item, query)).length;
    }

    // --- Helpers ---

    _matches(item, query) {
        for (const [key, value] of Object.entries(query)) {
            if (key.startsWith('$')) continue; // Skip complex operators for now
            if (item[key] !== value) return false;
        }
        return true;
    }

    _applyUpdate(doc, update) {
        const hasOperators = Object.keys(update).some(k => k.startsWith('$'));

        if (hasOperators) {
            if (update.$set) Object.assign(doc, update.$set);
            if (update.$inc) {
                for (const [key, val] of Object.entries(update.$inc)) {
                    doc[key] = (Number(doc[key]) || 0) + val;
                }
            }
            if (update.$unset) {
                for (const key of Object.keys(update.$unset)) {
                    delete doc[key];
                }
            }
        } else {
            Object.assign(doc, update);
        }
        doc.updatedAt = new Date();
    }

    _wrapDocument(doc) {
        if (!doc) return null;
        const self = this;
        // Keep it as a plain object but add methods
        const wrapped = { ...doc };

        wrapped.save = async function () {
            // Run pre-save hooks on 'this'
            if (self.hooks.pre['save']) {
                await self.hooks.pre['save'].call(this, () => { });
            }

            // Find and update in array
            const index = self.data.findIndex(i => String(i._id) === String(this._id));

            if (index !== -1) {
                self.data[index] = { ...this, updatedAt: new Date() };
            } else {
                const newDoc = { ...this, createdAt: new Date(), updatedAt: new Date() };
                self.data.push(newDoc);
            }
            self._save();
            return this;
        };

        wrapped.toObject = function () {
            const { save, toObject, ...rest } = this;
            return rest;
        };

        wrapped.toJSON = function () {
            return this.toObject();
        };

        // Add instance methods if any were registered
        if (this.instanceMethods) {
            Object.assign(wrapped, this.instanceMethods);
        }

        return wrapped;
    }

    pre(event, fn) {
        this.hooks.pre[event] = fn;
    }
}

module.exports = LocalDB;

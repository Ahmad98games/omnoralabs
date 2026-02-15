const { createModel } = require('../utils/modelFactory');
const bcrypt = require('bcryptjs');

const schema = {
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phone: { type: String },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  refreshToken: { type: String, select: false },
  addresses: [{
    street: String,
    city: String,
    postalCode: String,
    country: String
  }]
};

const hooks = {
  save: async function (next) {
    // Hardening for LocalDB / Mongoose hybrid
    const isModified = typeof this.isModified === 'function' ? this.isModified('password') : true;
    if (!isModified) return next();
    if (!this.password || this.password.startsWith('$2a$')) return next();

    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  }
};

const methods = {
  matchPassword: async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  },
  comparePassword: async function (enteredPassword) {
    return this.matchPassword(enteredPassword);
  },
  setRefreshToken: async function (token) {
    this.refreshToken = token;
  },
  verifyRefreshToken: async function (token) {
    return this.refreshToken === token;
  },
  clearRefreshToken: function () {
    this.refreshToken = null;
  }
};

module.exports = createModel('User', schema, { hooks, methods });
const { createModel } = require('../utils/modelFactory');

const schema = {
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
};

module.exports = createModel('Newsletter', schema);
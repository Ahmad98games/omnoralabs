const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET || ''}-refresh`;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables.');
}

const signAccessToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id.toString(), type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await user.setRefreshToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  phone: user.phone
});

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email.' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();
    const tokens = await issueTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: sanitizeUser(user),
      tokens
    });
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    return res.status(500).json({ error: 'Unable to register user at this time.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      user: sanitizeUser(user),
      tokens
    });
  } catch (error) {
    logger.error('Error logging in user', { error: error.message });
    return res.status(500).json({ error: 'Unable to login at this time.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const isValid = await user.verifyRefreshToken(refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: 'Refresh token has been revoked.' });
    }

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      tokens
    });
  } catch (error) {
    logger.warn('Refresh token rejected', { error: error.message });
    return res.status(401).json({ error: 'Unable to refresh token.' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: true });
    }
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.clearRefreshToken();
      await user.save({ validateBeforeSave: false });
    }
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error during logout', { error: error.message });
    return res.status(500).json({ error: 'Unable to logout.' });
  }
};

exports.getUserProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  return res.json({ success: true, user: sanitizeUser(req.user) });
};

exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { firstName, lastName, phone, password } = req.body;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(user)
    });
  } catch (error) {
    logger.error('Error updating profile', { error: error.message });
    return res.status(500).json({ error: 'Unable to update profile.' });
  }
};

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.statusCode = 400;
      throw new Error('Name, email and password are all required');
    }
    if (!EMAIL_REGEX.test(email)) {
      res.statusCode = 400;
      throw new Error('Please provide a valid email address');
    }
    if (password.length < 6) {
      res.statusCode = 400;
      throw new Error('Password must be at least 6 characters long');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 400;
      throw new Error('Email is already registered');
    }

    const newUser = await User.create({ name, email, password });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      message: 'Profile fetched successfully',
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile (protected)
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.statusCode = 400;
      throw new Error('Name and email are required');
    }
    if (!EMAIL_REGEX.test(email)) {
      res.statusCode = 400;
      throw new Error('Please provide a valid email address');
    }

    const emailTaken = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailTaken) {
      res.statusCode = 400;
      throw new Error('That email is already in use by another account');
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/change-password (protected)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.statusCode = 400;
      throw new Error('Current password and new password are required');
    }
    if (newPassword.length < 6) {
      res.statusCode = 400;
      throw new Error('New password must be at least 6 characters long');
    }

    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save(); // pre('save') hook re-hashes it automatically

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, changePassword };
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // the model hashes the password, and validates the fields.
    const user = await User.create({ username, email, password });
    logger.info(`Signup success: ${user._id}`);

    // toJSON removes the password so it is safe to return the user
    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    // 11000 means MongoDB duplicate key meaning username or email already exists
    if (err.code === 11000) {
      logger.warn('Signup failed: duplicate username or email');
      return res.status(409).json({
        message: 'Username or email already exists',
      });
    }

    // schema rules failed; required, minlength, email regex...
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: err.message,
      });
    }

    logger.error(`Signup error: ${err.message}`);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // password and one identifier (username or email) are required, and must be strings
    if (typeof password !== 'string' || (typeof username !== 'string' && typeof email !== 'string')) {
      return res.status(400).json({ message: 'Username or email and password are required' });
    }

    // password has select: false in the model, so we ask for it explicitly
    const query = typeof username === 'string' ? { username } : { email };
    const user = await User.findOne(query).select('+password');

    // same message for unknown user and wrong password, so we don't reveal which one failed
    if (!user) {
      logger.warn(`Login failed: unknown user ${username || email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: wrong password for ${user._id}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // the token only carries the user id; the secret comes from .env
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    logger.info(`Login success: ${user._id}`);

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};
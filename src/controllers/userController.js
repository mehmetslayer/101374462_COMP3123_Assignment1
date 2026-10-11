const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // the model hashes the password, and validates the fields.
    const user = await User.create({
      username,
      email,
      password,
    });

    // toJSON removes the password so it is safe to return the user
    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    // 11000 means MongoDB duplicate key meaning username or email already exists
    if (err.code === 11000) {
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

    res.status(500).json({
      message: 'Server error',
    });
  }
};
const { body } = require('express-validator');

exports.signupRules = [
  body('username', 'username must be 3-50 characters without spaces')
    .isString().trim().isLength({ min: 3, max: 50 }).matches(/^\S+$/),
  body('email', 'a valid email (max 50 characters) is required')
    .isString().trim().isEmail().isLength({ max: 50 }).toLowerCase(),
  body('password', 'password must be 8-50 characters with at least one letter and one number')
    .isString().isLength({ min: 8, max: 50 }).matches(/^(?=.*[A-Za-z])(?=.*\d).+$/),
];

// isString() also blocks objects like { "$ne": null } (NoSQL injection)
exports.loginRules = [
  body('password', 'password is required').isString().notEmpty(),
  body('username', 'username must be a string').optional().isString(),
  body('email', 'email must be a string').optional().isString(),
];
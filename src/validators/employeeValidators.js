const { body, param, query } = require('express-validator');

const text = (field, max) =>
  body(field, `${field} is required (max ${max} characters)`).isString().trim().notEmpty().isLength({ max });

exports.employeeBody = [
  text('first_name', 50),
  text('last_name', 50),
  body('email', 'a valid email (max 100 characters) is required')
    .isString().trim().isEmail().isLength({ max: 100 }).toLowerCase(),
  text('position', 100),
  text('department', 100),
  body('salary', 'salary must be a number greater than or equal to 0').isFloat({ min: 0 }),
  body('date_of_joining', 'date_of_joining must be a valid date (YYYY-MM-DD)').isISO8601(),
];

exports.employeeIdParam = [param('eid', 'Invalid employee ID').isMongoId()];
exports.employeeIdQuery = [query('eid', 'Invalid employee ID').isMongoId()];
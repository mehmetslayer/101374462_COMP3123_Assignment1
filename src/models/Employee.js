const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    salary: {
      type: Number,
      required: true,
      min: [0, 'Salary must be positive'],
    },
    date_of_joining: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // the owner; set from the authenticated user, never from the request body
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Employee', employeeSchema);
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// pick only the allowed fields so the client can't set `user` or other fields
const pickFields = (body) => {
  const { first_name, last_name, email, position, salary, date_of_joining, department } = body;
  return { first_name, last_name, email, position, salary, date_of_joining, department };
};

exports.getAll = async (req, res) => {
  try {
    // only the authenticated user's employees
    const employees = await Employee.find({ user: req.user._id });
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const employee = await Employee.create({
      ...pickFields(req.body),
      user: req.user._id,
    });
    res.status(201).json(employee);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { eid } = req.params;
    if (!isValidId(eid)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    // ownership is part of the query, so another user's employee is never found
    const employee = await Employee.findOne({ _id: eid, user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { eid } = req.params;
    if (!isValidId(eid)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: eid, user: req.user._id },
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    // spec: DELETE /api/v1/emp/employees?eid=xxx
    const { eid } = req.query;
    if (!isValidId(eid)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await Employee.findOneAndDelete({ _id: eid, user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
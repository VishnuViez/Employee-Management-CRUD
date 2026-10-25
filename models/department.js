const mongoose = require('mongoose');

// A department of the clinic (e.g. "General Dentistry").
// Departments do NOT store a list of employees: the link lives on the
// employee side (see employee.js), so there is only one place to keep in sync.
const departmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Department name is required'], unique: true, trim: true },
        description: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);

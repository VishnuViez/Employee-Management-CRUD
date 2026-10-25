const mongoose = require('mongoose');

// A member of the medical staff.
// `departments` is an array of Department IDs, which models the
// many-to-many relationship from the business brief: one employee can work
// in several departments (Lisa Harris is in two) and a department has many
// employees.
const employeeSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: [true, 'First name is required'], trim: true },
        lastName: { type: String, required: [true, 'Last name is required'], trim: true },
        departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);

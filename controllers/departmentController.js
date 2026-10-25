const Department = require('../models/department');
const Employee = require('../models/employee');
const { isValidId, handleError } = require('./helpers');

// ---- Reusable data functions (no req/res: any route or script can use them) ----

// All departments, alphabetically, each with how many employees it has.
const listDepartmentsWithCounts = async () => {
    const departments = await Department.find().sort('name').lean();
    const counts = await Employee.aggregate([
        { $unwind: '$departments' },
        { $group: { _id: '$departments', count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((c) => [String(c._id), c.count]));
    return departments.map((d) => ({ ...d, employeeCount: countById.get(String(d._id)) || 0 }));
};

// Employees who belong to one department.
const findEmployeesInDepartment = (departmentId) =>
    Employee.find({ departments: departmentId }).sort('lastName firstName').populate('departments');

// ---- Controllers (called by routes/departmentRoutes.js) ----

// GET /api/departments
exports.getAllDepartments = async (req, res) => {
    try {
        res.json(await listDepartmentsWithCounts());
    } catch (err) {
        handleError(res, err);
    }
};

// GET /api/departments/:id  -> the department plus its staff
exports.getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid department id' });

        const department = await Department.findById(id);
        if (!department) return res.status(404).json({ message: 'Department not found' });

        const employees = await findEmployeesInDepartment(id);
        res.json({ department, employees });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /api/departments
exports.createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Department name is required' });
        }
        const department = await Department.create({ name, description });
        res.status(201).json(department);
    } catch (err) {
        handleError(res, err);
    }
};

// PUT /api/departments/:id
exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid department id' });

        const { name, description } = req.body;
        if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
            return res.status(400).json({ message: 'Department name cannot be empty' });
        }
        // Only change the fields the client actually sent.
        const changes = {};
        if (name !== undefined) changes.name = name;
        if (description !== undefined) changes.description = description;

        const department = await Department.findByIdAndUpdate(id, changes, {
            returnDocument: 'after',
            runValidators: true,
        });
        if (!department) return res.status(404).json({ message: 'Department not found' });
        res.json(department);
    } catch (err) {
        handleError(res, err);
    }
};

// DELETE /api/departments/:id
// The department is deleted and removed from every employee who was in it,
// so no employee is left pointing at a department that no longer exists.
exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid department id' });

        const department = await Department.findByIdAndDelete(id);
        if (!department) return res.status(404).json({ message: 'Department not found' });

        const result = await Employee.updateMany({ departments: id }, { $pull: { departments: id } });
        res.json({ message: 'Department deleted', unassignedEmployees: result.modifiedCount });
    } catch (err) {
        handleError(res, err);
    }
};

exports.listDepartmentsWithCounts = listDepartmentsWithCounts;
exports.findEmployeesInDepartment = findEmployeesInDepartment;

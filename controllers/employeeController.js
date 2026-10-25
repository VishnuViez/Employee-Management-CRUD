const Employee = require('../models/employee');
const Department = require('../models/department');
const { isValidId, handleError } = require('./helpers');

// ---- Reusable data functions ----

// Checks a list of department IDs sent by the client.
// Returns an error message, or null when every ID is valid and exists.
const checkDepartmentIds = async (ids) => {
    if (!Array.isArray(ids)) return 'departments must be a list of department ids';
    if (ids.some((id) => !isValidId(id))) return 'One or more department ids are invalid';
    const unique = [...new Set(ids.map(String))];
    const found = await Department.countDocuments({ _id: { $in: unique } });
    if (found !== unique.length) return 'One or more departments do not exist';
    return null;
};

const findEmployeeById = (id) => Employee.findById(id).populate('departments');

// ---- Controllers (called by routes/employeeRoutes.js) ----

// GET /api/employees            -> everyone
// GET /api/employees?department=<id>  -> only that department's staff
exports.getAllEmployees = async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) {
            if (!isValidId(req.query.department)) {
                return res.status(400).json({ message: 'Invalid department id' });
            }
            filter.departments = req.query.department;
        }
        const employees = await Employee.find(filter).sort('lastName firstName').populate('departments');
        res.json(employees);
    } catch (err) {
        handleError(res, err);
    }
};

// GET /api/employees/:id
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid employee id' });

        const employee = await findEmployeeById(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        handleError(res, err);
    }
};

// POST /api/employees   body: { firstName, lastName, departments: [ids] }
exports.createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, departments = [] } = req.body;
        if (typeof firstName !== 'string' || !firstName.trim() || typeof lastName !== 'string' || !lastName.trim()) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }
        const problem = await checkDepartmentIds(departments);
        if (problem) return res.status(400).json({ message: problem });

        const created = await Employee.create({ firstName, lastName, departments: [...new Set(departments)] });
        res.status(201).json(await findEmployeeById(created._id));
    } catch (err) {
        handleError(res, err);
    }
};

// PUT /api/employees/:id   body: any of { firstName, lastName, departments }
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid employee id' });

        const { firstName, lastName, departments } = req.body;
        for (const [label, value] of [['First name', firstName], ['Last name', lastName]]) {
            if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
                return res.status(400).json({ message: `${label} cannot be empty` });
            }
        }
        if (departments !== undefined) {
            const problem = await checkDepartmentIds(departments);
            if (problem) return res.status(400).json({ message: problem });
        }

        // Only change the fields the client actually sent.
        const changes = {};
        if (firstName !== undefined) changes.firstName = firstName;
        if (lastName !== undefined) changes.lastName = lastName;
        if (departments !== undefined) changes.departments = [...new Set(departments)];

        const employee = await Employee.findByIdAndUpdate(id, changes, {
            returnDocument: 'after',
            runValidators: true,
        }).populate('departments');
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        handleError(res, err);
    }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: 'Invalid employee id' });

        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /api/employees/:id/departments/:deptId   -> assign to a department
exports.assignDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        if (!isValidId(id) || !isValidId(deptId)) return res.status(400).json({ message: 'Invalid id' });

        if (!(await Department.exists({ _id: deptId }))) {
            return res.status(404).json({ message: 'Department not found' });
        }
        // $addToSet only adds the id if it is not already in the list.
        const employee = await Employee.findByIdAndUpdate(
            id,
            { $addToSet: { departments: deptId } },
            { returnDocument: 'after' }
        ).populate('departments');
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        handleError(res, err);
    }
};

// DELETE /api/employees/:id/departments/:deptId  -> remove from a department
exports.removeDepartment = async (req, res) => {
    try {
        const { id, deptId } = req.params;
        if (!isValidId(id) || !isValidId(deptId)) return res.status(400).json({ message: 'Invalid id' });

        const employee = await Employee.findByIdAndUpdate(
            id,
            { $pull: { departments: deptId } },
            { returnDocument: 'after' }
        ).populate('departments');
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        handleError(res, err);
    }
};

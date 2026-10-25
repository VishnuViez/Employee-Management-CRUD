const express = require('express');
const router = express.Router();
const c = require('../controllers/employeeController');

// Mounted at /api/employees in app.js.
router.get('/', c.getAllEmployees);
router.get('/:id', c.getEmployeeById);
router.post('/', c.createEmployee);
router.put('/:id', c.updateEmployee);
router.delete('/:id', c.deleteEmployee);

// Assigning / removing an employee to / from a department.
router.post('/:id/departments/:deptId', c.assignDepartment);
router.delete('/:id/departments/:deptId', c.removeDepartment);

module.exports = router;

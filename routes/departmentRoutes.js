const express = require('express');
const router = express.Router();
const c = require('../controllers/departmentController');

// Routes only map a URL + HTTP method to a controller function.
// Mounted at /api/departments in app.js.
router.get('/', c.getAllDepartments);
router.get('/:id', c.getDepartmentById);
router.post('/', c.createDepartment);
router.put('/:id', c.updateDepartment);
router.delete('/:id', c.deleteDepartment);

module.exports = router;

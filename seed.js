// Loads the departments and staff from the Apollonia business brief.
// Run with:  npm run seed   (or inside Docker: docker compose exec app npm run seed)
// WARNING: it first deletes all existing departments and employees.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Department = require('./models/department');
const Employee = require('./models/employee');

const departmentNames = [
    'General Dentistry',
    'Pediatric Dentistry',
    'Restorative Dentistry',
    'Surgery',
    'Orthodontics',
];

// Each employee and the department(s) they belong to.
const staff = [
    ['Lisa', 'Harris', ['Restorative Dentistry', 'Orthodontics']],
    ['Alfred', 'Christensen', ['General Dentistry']],
    ['John', 'Dudley', ['General Dentistry']],
    ['Danny', 'Perez', ['Restorative Dentistry']],
    ['Sarah', 'Alvarez', ['Pediatric Dentistry']],
    ['Constance', 'Smith', ['Surgery']],
    ['Travis', 'Combs', []], // listed as an employee but not in any department
    ['Francisco', 'Willard', ['Pediatric Dentistry']],
    ['Janet', 'Doe', ['General Dentistry']],
    ['Leslie', 'Roche', ['Orthodontics']],
];

const seed = async () => {
    await connectDB();

    await Employee.deleteMany({});
    await Department.deleteMany({});

    const departments = await Department.insertMany(departmentNames.map((name) => ({ name })));
    const idByName = Object.fromEntries(departments.map((d) => [d.name, d._id]));

    await Employee.insertMany(
        staff.map(([firstName, lastName, depts]) => ({
            firstName,
            lastName,
            departments: depts.map((name) => idByName[name]),
        }))
    );

    console.log(`Seeded ${departments.length} departments and ${staff.length} employees`);
};

seed()
    .catch((err) => {
        console.error('Seeding failed:', err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());

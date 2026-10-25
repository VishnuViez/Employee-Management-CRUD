const path = require('path');
const express = require('express');
require('dotenv').config();

const connectDB = require('./config/db');
const departmentRoutes = require('./routes/departmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const port = process.env.NODE_LOCAL_PORT || 3020;

// Read JSON request bodies (sent by the pages' fetch calls).
app.use(express.json());

// Serve the pages in /public (index.html, employees.html, css, js).
app.use(express.static(path.join(__dirname, 'public')));

// REST API
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);

// Unknown API path
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Last-resort error handler (e.g. a request body that is not valid JSON).
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body is not valid JSON' });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

// Connect to the database FIRST, then start accepting requests.
// If MongoDB is not reachable, exit with an error so Docker can restart us.
const start = async () => {
    try {
        await connectDB();
        app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
    } catch (err) {
        console.error('Could not connect to MongoDB:', err.message);
        process.exit(1);
    }
};

start();

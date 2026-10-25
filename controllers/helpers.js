const mongoose = require('mongoose');

// Small helpers shared by both controllers.

// true when `id` has the shape of a MongoDB ObjectId.
const isValidId = (id) => mongoose.isValidObjectId(id);

// Turns database errors into a clean HTTP response for the client.
const handleError = (res, err) => {
    if (err.name === 'ValidationError') {
        // e.g. a required field is missing: send the first message back.
        const message = Object.values(err.errors)[0].message;
        return res.status(400).json({ message });
    }
    if (err.code === 11000) {
        // Duplicate key: the unique index on a field was violated.
        return res.status(409).json({ message: 'A record with that name already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
};

module.exports = { isValidId, handleError };

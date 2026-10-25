const mongoose = require('mongoose');

// Inside Docker Compose the database is reachable by its service name "mongo".
// When running outside Docker, set MONGO_URL=mongodb://localhost:27017/apollonia
const url = process.env.MONGO_URL || 'mongodb://mongo:27017/apollonia';

// Returns a promise. If the connection fails, the error is passed on (not
// swallowed) so that app.js can refuse to start without a database.
const connectDB = async () => {
    await mongoose.connect(url);
    console.log('Connected to MongoDB');
};

module.exports = connectDB;

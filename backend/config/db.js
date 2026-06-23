const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.MONGO_URI;

  if (!dbURI) {
    console.error('MONGO_URI is missing. Add it to your .env file (see .env.example).');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
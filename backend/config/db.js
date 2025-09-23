const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn =await mongoose.connect(process.env.MONGO_URI, {
      // no options required for mongoose 6+
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;

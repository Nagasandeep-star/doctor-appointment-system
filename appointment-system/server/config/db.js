const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      console.error(`❌ MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('   Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;

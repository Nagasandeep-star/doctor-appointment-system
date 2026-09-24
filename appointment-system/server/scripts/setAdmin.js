require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@test.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Admin role set. Modified:', result.modifiedCount);
  process.exit(0);
})();

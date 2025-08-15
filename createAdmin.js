const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const name = 'Super Admin';
  const email = 'admin2@navigatio.com'; // Change if you want a different admin email
  const password = 'Admin@1234'; // Change to a secure password
  const role = 'admin';

  // Check if user already exists
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin user already exists:', email);
    mongoose.disconnect();
    return;
  }

  const user = new User({
    name,
    email,
    password,
    role,
    isApproved: true,
  });
  await user.save();
  console.log('Admin user created:', email);
  mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error('Error creating admin:', err);
  mongoose.disconnect();
});

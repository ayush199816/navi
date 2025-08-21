const mongoose = require('mongoose');
require('dotenv').config();

async function checkBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/navi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('guestsightseeingbookings');
    
    // Count documents
    const count = await collection.countDocuments();
    console.log(`Found ${count} bookings`);
    
    // Show sample documents if any exist
    if (count > 0) {
      const sample = await collection.find().limit(2).toArray();
      console.log('Sample booking documents:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();

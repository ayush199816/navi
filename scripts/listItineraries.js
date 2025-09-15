require('dotenv').config();
const mongoose = require('mongoose');
const Itinerary = require('../models/Itinerary');

async function listItineraries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all itineraries and select only the _id and createdBy fields
    const itineraries = await Itinerary.find({})
      .select('_id title createdBy createdAt')
      .sort({ createdAt: -1 });

    console.log('\n=== Itineraries ===');
    if (itineraries.length === 0) {
      console.log('No itineraries found in the database.');
    } else {
      console.log(`Found ${itineraries.length} itineraries:\n`);
      itineraries.forEach((itinerary, index) => {
        console.log(`${index + 1}. ID: ${itinerary._id}`);
        console.log(`   Title: ${itinerary.title}`);
        console.log(`   Created By: ${itinerary.createdBy}`);
        console.log(`   Created At: ${itinerary.createdAt}`);
        console.log('   --------------------');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
listItineraries();

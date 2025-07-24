const mongoose = require('mongoose');
require('dotenv').config();

async function checkItineraries() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the Itinerary model
    const Itinerary = mongoose.model('Itinerary');
    
    // Find all itineraries
    const itineraries = await Itinerary.find({})
      .select('_id title createdBy createdAt')
      .lean();

    console.log('\n=== Itineraries ===');
    console.log(`Found ${itineraries.length} itineraries`);
    
    if (itineraries.length > 0) {
      console.log('\nItinerary Details:');
      console.log(JSON.stringify(itineraries, null, 2));
      
      // Log unique agent IDs
      const agentIds = [...new Set(itineraries.map(i => i.createdBy?.toString()))];
      console.log('\nUnique Agent IDs found:');
      console.log(agentIds);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkItineraries();

require('dotenv').config();
const mongoose = require('mongoose');
const GuestSightseeing = require('../models/GuestSightseeing');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/navigatio';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all sightseeings
    const sightseeings = await GuestSightseeing.find({});
    console.log(`Found ${sightseeings.length} sightseeings to check`);

    let updatedCount = 0;
    
    for (const sightseeing of sightseeings) {
      const update = {};
      
      // Check if duration needs updating
      if (!sightseeing.duration || 
          sightseeing.duration === 'undefined' || 
          sightseeing.duration.trim() === '') {
        update.duration = 'Not specified';
      }
      
      // Check if inclusions needs updating
      if (!sightseeing.inclusions || 
          !Array.isArray(sightseeing.inclusions) || 
          sightseeing.inclusions.length === 0 ||
          (sightseeing.inclusions.length === 1 && 
           (sightseeing.inclusions[0] === 'undefined' || 
            sightseeing.inclusions[0].trim() === ''))) {
        update.inclusions = ['No inclusions specified'];
      }
      
      console.log('Sightseeing:', {
        _id: sightseeing._id,
        currentDuration: sightseeing.duration,
        currentInclusions: sightseeing.inclusions,
        update
      });
      
      if (Object.keys(update).length > 0) {
        await GuestSightseeing.updateOne(
          { _id: sightseeing._id },
          { $set: update }
        );
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} sightseeings`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

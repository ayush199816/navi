const mongoose = require('mongoose');
require('dotenv').config();

async function testDB() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections:');
    collections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name}`);
    });
    
    // Check if guestsightseeings collection exists
    const collectionNames = collections.map(c => c.name);
    const hasGuestSightseeings = collectionNames.includes('guestsightseeings');
    
    console.log('\nHas guestsightseeings collection?', hasGuestSightseeings);
    
    if (hasGuestSightseeings) {
      const GuestSightseeing = mongoose.model('GuestSightseeing', new mongoose.Schema({}), 'guestsightseeings');
      const count = await GuestSightseeing.countDocuments();
      console.log(`\nFound ${count} documents in guestsightseeings collection`);
      
      if (count > 0) {
        const doc = await GuestSightseeing.findOne();
        console.log('\nSample document:', JSON.stringify(doc, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDB();

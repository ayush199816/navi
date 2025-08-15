const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📂 Collections in database:');
    collections.forEach((collection, i) => {
      console.log(`${i + 1}. ${collection.name}`);
    });
    
    // Check if guestsightseeings collection exists
    const collectionExists = collections.some(c => c.name === 'guestsightseeings');
    
    if (collectionExists) {
      console.log('\n🔍 Found guestsightseeings collection');
      
      // Count documents in the collection
      const count = await mongoose.connection.db.collection('guestsightseeings').countDocuments();
      console.log(`📊 Total documents in guestsightseeings: ${count}`);
      
      // Get sample documents
      if (count > 0) {
        const sample = await mongoose.connection.db.collection('guestsightseeings').findOne({});
        console.log('\n📄 Sample document:');
        console.log(JSON.stringify(sample, null, 2));
      }
    } else {
      console.log('\n❌ guestsightseeings collection not found');
      
      // Check for alternative collection names (case-insensitive)
      const altCollection = collections.find(c => 
        c.name.toLowerCase().includes('sightseeing') || 
        c.name.toLowerCase().includes('guest')
      );
      
      if (altCollection) {
        console.log(`\nℹ️ Found similar collection: ${altCollection.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

testConnection();

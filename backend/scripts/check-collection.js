const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Available collections:');
    collections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name}`);
    });
    
    // Check if our collection exists
    const collectionExists = collections.some(c => c.name === 'guestsightseeings');
    console.log(`\n🔍 Collection 'guestsightseeings' exists: ${collectionExists ? '✅' : '❌'}`);
    
    if (collectionExists) {
      // Get document count
      const count = await mongoose.connection.db.collection('guestsightseeings').countDocuments();
      console.log(`📊 Documents in collection: ${count}`);
      
      if (count > 0) {
        // Get first document
        const doc = await mongoose.connection.db.collection('guestsightseeings').findOne({});
        console.log('\n📄 Sample document:');
        console.log(JSON.stringify(doc, null, 2));
      }
    } else {
      // Check for similar collection names
      const similarCollections = collections.filter(c => 
        c.name.toLowerCase().includes('sight') || 
        c.name.toLowerCase().includes('guest')
      );
      
      if (similarCollections.length > 0) {
        console.log('\n🔍 Similar collections found:');
        similarCollections.forEach(col => {
          console.log(`- ${col.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCollection();

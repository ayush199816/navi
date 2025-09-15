const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongo() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    //console.log('✅ Connected to MongoDB');
    
    // Get the database
    const db = client.db();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    //console.log('\n📂 Collections:');
    collections.forEach((col, i) => {
      //console.log(`${i + 1}. ${col.name}`);
    });
    
    // Check if guestsightseeings collection exists
    const collectionNames = collections.map(c => c.name);
    const hasGuestSightseeings = collectionNames.includes('guestsightseeings');
    
    //console.log('\nHas guestsightseeings collection?', hasGuestSightseeings);
    
    if (hasGuestSightseeings) {
      const collection = db.collection('guestsightseeings');
      const count = await collection.countDocuments();
      //console.log(`\n📊 Found ${count} documents in guestsightseeings collection`);
      
      if (count > 0) {
        const doc = await collection.findOne({});
        //console.log('\n📄 Sample document:');
        //console.log(JSON.stringify(doc, null, 2));
      }
    } else {
      // Check for similar collection names
      const similarCollections = collections.filter(c => 
        c.name.toLowerCase().includes('sightseeing') || 
        c.name.toLowerCase().includes('guest')
      );
      
      if (similarCollections.length > 0) {
        //console.log('\n🔍 Similar collections found:');
        similarCollections.forEach(col => {
          //console.log(`- ${col.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    //console.log('\n🔌 Disconnected from MongoDB');
  }
}

testMongo();

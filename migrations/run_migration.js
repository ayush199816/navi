const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Default currency mapping based on country
const COUNTRY_CURRENCY_MAP = {
  'India': 'INR',
  'Singapore': 'SGD',
  'United Arab Emirates': 'AED',
  'Dubai': 'AED',
  'Indonesia': 'IDR',
  'Thailand': 'THB',
  'Vietnam': 'VND',
  'Malaysia': 'MYR',
  'France': 'EUR',
  'Germany': 'EUR',
  'Italy': 'EUR',
  'Spain': 'EUR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Australia': 'AUD',
  'Canada': 'CAD',
  'Japan': 'JPY',
  'China': 'CNY',
  'South Korea': 'KRW',
  'Russia': 'RUB',
  'Brazil': 'BRL'
};

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the Sightseeing model
    const Sightseeing = mongoose.model('Sightseeing');

    // Find all sightseeing documents
    const sightseeings = await Sightseeing.find({});
    console.log(`Found ${sightseeings.length} sightseeing documents`);

    let updatedCount = 0;
    
    // Update each document with the appropriate currency
    for (const doc of sightseeings) {
      const country = doc.country;
      const currency = COUNTRY_CURRENCY_MAP[country] || 'USD';
      
      // Only update if currency is not set or is different
      if (!doc.currency || doc.currency !== currency) {
        console.log(`Updating ${doc.name} (${country}): ${doc.currency || 'no currency'} -> ${currency}`);
        
        await Sightseeing.updateOne(
          { _id: doc._id },
          { $set: { currency: currency } }
        );
        
        updatedCount++;
      }
    }

    console.log(`\nUpdated ${updatedCount} sightseeing documents with currency information`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration();

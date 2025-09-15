// Migration script to add currency field to existing sightseeing documents
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Enable debug logging
mongoose.set('debug', true);

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

const getDefaultCurrency = (country) => {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
};

const runMigration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the Sightseeing model
    const Sightseeing = mongoose.model('Sightseeing');

    console.log('Fetching sightseeing documents...');
    
    // First, find all sightseeing documents to check their current state
    const allSightseeings = await Sightseeing.find({});
    console.log(`Found ${allSightseeings.length} total sightseeing documents`);
    
    // Log a few documents to see their current state
    console.log('Sample documents:', allSightseeings.slice(0, 3).map(doc => ({
      _id: doc._id,
      name: doc.name,
      country: doc.country,
      currency: doc.currency,
      hasCurrency: doc.currency !== undefined && doc.currency !== null
    })));
    
    // Find all sightseeing documents that need updating
    const sightseeings = allSightseeings.filter(doc => 
      doc.currency === undefined || doc.currency === null
    );
    
    console.log(`Found ${sightseeings.length} sightseeing documents that need currency update`);

    console.log(`Found ${sightseeings.length} sightseeing documents to update`);

    // Update each document with the appropriate currency
    let updatedCount = 0;
    for (const sightseeing of sightseeings) {
      try {
        const currency = getDefaultCurrency(sightseeing.country);
        console.log(`Updating sightseeing ${sightseeing._id} (${sightseeing.name}) with currency ${currency}`);
        
        const result = await Sightseeing.updateOne(
          { _id: sightseeing._id },
          { $set: { currency } }
        );
        
        console.log(`Update result for ${sightseeing._id}:`, result);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating sightseeing ${sightseeing._id}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} out of ${sightseeings.length} documents`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();

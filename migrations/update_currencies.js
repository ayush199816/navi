// Script to update currencies for existing sightseeing documents
// Run this in MongoDB shell with: load('backend/migrations/update_currencies.js')

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

// Get all sightseeing documents
const sightseeings = db.sightseeings.find({});
let updatedCount = 0;

print(`Found ${sightseeings.count()} sightseeing documents`);

// Update each document with the appropriate currency
sightseeings.forEach(function(doc) {
  const country = doc.country;
  const currency = COUNTRY_CURRENCY_MAP[country] || 'USD';
  
  // Only update if currency is not set or is different
  if (!doc.currency || doc.currency !== currency) {
    print(`Updating ${doc.name} (${country}): ${doc.currency || 'no currency'} -> ${currency}`);
    db.sightseeings.updateOne(
      { _id: doc._id },
      { $set: { currency: currency } }
    );
    updatedCount++;
  }
});

print(`\nUpdated ${updatedCount} sightseeing documents with currency information`);

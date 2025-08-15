const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Determine the path to the .env file
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Load environment variables
dotenv.config({ path: envPath });

// Check if MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB Connected');
  migrateSalesStatus();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function migrateSalesStatus() {
  try {
    console.log('Starting migration of sales status...');
    
    // Get the Quote model after updating the schema
    const Quote = require('../models/Quote');
    
    // First, find all quotes that need to be migrated
    const quotesToMigrate = await Quote.find({ 
      $or: [
        { status: 'in_sales' },
        { salesStatus: { $exists: false }, status: { $nin: ['pending', 'rejected', 'expired'] } }
      ]
    });

    console.log(`Found ${quotesToMigrate.length} quotes to migrate`);
    
    let updatedCount = 0;
    
    // Process each quote individually for better error handling
    for (const quote of quotesToMigrate) {
      try {
        const update = {};
        
        // If status is 'in_sales', reset it to 'pending' and set salesStatus
        if (quote.status === 'in_sales') {
          update.status = 'pending';
          update.salesStatus = 'converted_to_lead';
          console.log(`Migrating quote ${quote.quoteId}: status=${quote.status} -> pending, salesStatus=converted_to_lead`);
        } 
        // If status is not 'in_sales' but has no salesStatus, set salesStatus based on status
        else if (!quote.salesStatus) {
          update.salesStatus = 
            quote.status === 'accepted' ? 'converted_to_lead' : 
            quote.status === 'rejected' ? 'lost' : 'in_progress';
          
          console.log(`Setting salesStatus for quote ${quote.quoteId}: status=${quote.status} -> salesStatus=${update.salesStatus}`);
        }
        
        // Only update if we have changes to make
        if (Object.keys(update).length > 0) {
          await Quote.updateOne({ _id: quote._id }, { $set: update });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error migrating quote ${quote.quoteId || quote._id}:`, error.message);
      }
    }
    
    console.log(`Migration complete. Successfully updated ${updatedCount} out of ${quotesToMigrate.length} quotes.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

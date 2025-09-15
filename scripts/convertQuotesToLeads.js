const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quote = require('../models/Quote');
const SalesLead = require('../models/SalesLead');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
  convertQuotesToLeads();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function convertQuotesToLeads() {
  try {
    console.log('Starting to convert quotes to leads...');
    
    // Find all quotes that don't have a lead yet and are not rejected or already converted
    const quotes = await Quote.find({
      status: { $nin: ['rejected', 'converted_to_lead', 'in_sales'] }
    });

    console.log(`Found ${quotes.length} quotes to process`);

    let convertedCount = 0;
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      throw new Error('No admin user found to assign leads to');
    }

    for (const quote of quotes) {
      try {
        // Check if lead already exists for this quote
        const existingLead = await SalesLead.findOne({ quote: quote._id });
        
        if (!existingLead) {
          const leadData = {
            quote: quote._id,
            assignedTo: adminUser._id, // Assign to admin by default
            createdBy: adminUser._id,
            value: quote.quotedPrice || 0,
            source: 'agent',
            status: 'new',
            notes: [{
              content: 'Automatically converted from quote',
              createdBy: adminUser._id
            }]
          };

          await SalesLead.create(leadData);
          
          // Update quote status
          quote.status = 'in_sales';
          await quote.save();
          
          convertedCount++;
          console.log(`Converted quote ${quote.quoteId} to lead`);
        }
      } catch (error) {
        console.error(`Error processing quote ${quote.quoteId}:`, error.message);
      }
    }

    console.log(`\nConversion complete!`);
    console.log(`Total quotes processed: ${quotes.length}`);
    console.log(`New leads created: ${convertedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error in convertQuotesToLeads:', error);
    process.exit(1);
  }
}

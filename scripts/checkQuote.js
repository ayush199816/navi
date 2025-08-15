require('dotenv').config();
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');

// Enable debug logging
mongoose.set('debug', true);

async function checkQuote(quoteId) {
  let client;
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    // Get the MongoDB client
    client = mongoose.connection.getClient();
    console.log('Connected to MongoDB');

    // Find the quote by quoteId if it looks like a quote ID, otherwise treat as _id
    let query;
    if (/^[A-Z]\d+$/.test(quoteId)) {
      console.log(`\n=== Checking Quote by quoteId: ${quoteId} ===`);
      query = { quoteId };
    } else {
      console.log(`\n=== Checking Quote by _id: ${quoteId} ===`);
      query = { _id: new mongoose.Types.ObjectId(quoteId) };
    }
    
    const quote = await Quote.findOne(query)
      .populate('agent', 'name email')
      .populate('booking', 'bookingId status')
      .lean();

    if (!quote) {
      console.log('Quote not found');
      return;
    }

    console.log('\n=== Quote Details ===');
    console.log(`ID: ${quote._id}`);
    console.log(`Quote ID: ${quote.quoteId}`);
    console.log(`Status: ${quote.status}`);
    console.log(`Agent: ${quote.agent?.name} (${quote.agent?.email})`);
    console.log(`Booking Reference: ${quote.booking ? quote.booking.bookingId : 'None'}`);
    console.log(`Created At: ${quote.createdAt}`);
    console.log(`Updated At: ${quote.updatedAt}`);

    // Check for any bookings referencing this quote
    console.log('\n=== Related Bookings ===');
    const bookings = await Booking.find({ quote: quote._id });
    if (bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`\nBooking ${index + 1}:`);
        console.log(`- ID: ${booking._id}`);
        console.log(`- Booking ID: ${booking.bookingId}`);
        console.log(`- Status: ${booking.bookingStatus}`);
        console.log(`- Created At: ${booking.createdAt}`);
      });
    } else {
      console.log('No bookings found for this quote');
    }

    // Check if there are any updates to this quote
    const updates = await Quote.find({ _id: quote._id }, { 'history': { $slice: -5 } });
    if (updates.length > 0 && updates[0].history && updates[0].history.length > 0) {
      console.log('\n=== Recent Updates ===');
      updates[0].history.slice(-5).forEach(update => {
        console.log(`[${update.timestamp}] ${update.action} by ${update.user?.name || 'system'}`);
        if (update.changes) {
          console.log('Changes:', JSON.stringify(update.changes, null, 2));
        }
      });
    }

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
  } finally {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
      }
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    process.exit(0);
  }
}

// Get quote ID from command line arguments
const quoteId = process.argv[2]?.trim();
if (!quoteId) {
  console.log('Please provide a quote ID as an argument');
  process.exit(1);
}

// Run the check
checkQuote(quoteId);

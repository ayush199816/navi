require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkQuote(quoteId) {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Find the quote by quoteId
    console.log(`\n=== Checking Quote: ${quoteId} ===`);
    const quote = await db.collection('quotes').findOne({ quoteId });
    
    if (!quote) {
      console.log('Quote not found');
      return;
    }

    console.log('\n=== Quote Details ===');
    // Print all fields from the quote
    Object.entries(quote).forEach(([key, value]) => {
      // Skip _id as we'll print it separately
      if (key === '_id') return;
      
      // Handle ObjectId and Date objects
      let displayValue = value;
      if (value && typeof value === 'object') {
        if (value._bsontype === 'ObjectID') {
          displayValue = value.toString();
        } else if (value instanceof Date) {
          displayValue = value.toISOString();
        } else if (value.startDate && value.endDate) { // Handle travelDates
          displayValue = `${new Date(value.startDate).toISOString()} to ${new Date(value.endDate).toISOString()}`;
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        }
      }
      
      console.log(`${key}: ${displayValue}`);
    });

    // Check for any bookings referencing this quote
    console.log('\n=== Checking for Bookings ===');
    const bookings = await db.collection('bookings').find({ quote: quote._id }).toArray();
    
    if (bookings.length > 0) {
      console.log(`\nFound ${bookings.length} booking(s) for this quote:`);
      bookings.forEach((booking, index) => {
        console.log(`\nBooking ${index + 1}:`);
        console.log(`- Booking ID: ${booking.bookingId}`);
        console.log(`- Status: ${booking.bookingStatus}`);
        console.log(`- Created: ${booking.createdAt.toISOString()}`);
        console.log(`- Total Amount: ${booking.totalAmount || 'N/A'}`);
        console.log(`- Payment Status: ${booking.paymentStatus || 'N/A'}`);
      });
    } else {
      console.log('No bookings found for this quote');
      
      // Check if there are any bookings with this quote ID in a different format
      const altBookings = await db.collection('bookings').find({ 'quoteId': quote.quoteId }).toArray();
      if (altBookings.length > 0) {
        console.log('\nFound bookings using quoteId (not _id reference):');
        altBookings.forEach((booking, index) => {
          console.log(`\nBooking ${index + 1}:`);
          console.log(`- Booking ID: ${booking.bookingId}`);
          console.log(`- Status: ${booking.bookingStatus}`);
          console.log(`- Created: ${booking.createdAt.toISOString()}`);
        });
      }
    }

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
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

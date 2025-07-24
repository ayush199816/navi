require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure they're registered with Mongoose
const User = require('../models/User');
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Lead = require('../models/Lead');

// Make sure all models are registered before using them
require('../models/Package'); // Import any other models that might be referenced

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const createBookingsFromAcceptedQuotes = async () => {
  try {
    console.log('Starting to process accepted quotes without bookings...');
    
    // Find all quotes with 'accepted' status
    const acceptedQuotes = await Quote.find({ status: 'accepted' }).populate('agent');
    console.log(`Found ${acceptedQuotes.length} accepted quotes`);
    
    let bookingsCreated = 0;
    let alreadyHasBooking = 0;
    let errors = 0;
    
    // Process each accepted quote
    for (const quote of acceptedQuotes) {
      try {
        // Check if a booking already exists for this quote
        const existingBooking = await Booking.findOne({ quote: quote._id });
        
        if (existingBooking) {
          console.log(`Quote ${quote.quoteId} already has booking ${existingBooking.bookingId}`);
          alreadyHasBooking++;
          continue;
        }
        
        // Create booking data from quote information
        const bookingData = {
          agent: quote.agent._id,
          quote: quote._id,
          customerDetails: {
            name: quote.customerName,
            email: quote.customerEmail,
            phone: quote.customerPhone
          },
          travelDates: quote.travelDates,
          // Create travelers array with at least one traveler (the customer)
          travelers: [
            {
              name: quote.customerName,
              age: 30, // Default age since we don't have this information
              gender: 'other' // Default gender since we don't have this information
            }
          ],
          totalAmount: quote.quotedPrice || quote.budget,
          agentCommission: 0, // Will be calculated if package exists
          specialRequirements: quote.requirements,
          paymentStatus: 'pending',
          bookingStatus: 'pending',
          destination: quote.destination
        };
        
        // Create booking
        const booking = await Booking.create(bookingData);
        console.log(`Created booking ${booking.bookingId} from quote ${quote.quoteId}`);
        bookingsCreated++;
        
        // Add a note to the quote discussion about booking creation
        if (!quote.discussion) {
          quote.discussion = [];
        }
        
        quote.discussion.push({
          message: `Booking created successfully with ID: ${booking.bookingId}`,
          timestamp: new Date(),
          user: 'System',
          type: 'system'
        });
        
        await quote.save();
      } catch (err) {
        console.error(`Error processing quote ${quote.quoteId}:`, err);
        errors++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`Total accepted quotes: ${acceptedQuotes.length}`);
    console.log(`Bookings created: ${bookingsCreated}`);
    console.log(`Quotes that already had bookings: ${alreadyHasBooking}`);
    console.log(`Errors encountered: ${errors}`);
    
  } catch (err) {
    console.error('Error in main process:', err);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the main function
createBookingsFromAcceptedQuotes();

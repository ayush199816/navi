const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function createTestBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Explicitly register all required models to avoid MissingSchemaError
    require('./models/User');
    require('./models/Package');
    require('./models/Lead');
    require('./models/Wallet');
    
    // Import models after registering them
    const Quote = require('./models/Quote');
    const Booking = require('./models/Booking');
    
    // Find an accepted quote
    const quote = await Quote.findOne({ status: 'accepted' }).populate('agent');
    
    if (!quote) {
      console.log('No accepted quotes found');
      process.exit(0);
    }
    
    console.log('Found accepted quote:', quote._id);
    console.log('Quote details:', {
      agent: quote.agent ? quote.agent._id : 'No agent',
      customerName: quote.customerName,
      destination: quote.destination,
      travelDates: quote.travelDates
    });
    
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
      travelers: [
        {
          name: quote.customerName,
          age: 30, // Default age
          gender: 'other' // Default gender
        }
      ],
      totalAmount: quote.quotedPrice || quote.budget,
      agentCommission: 0,
      specialRequirements: quote.requirements,
      paymentStatus: 'pending',
      bookingStatus: 'pending',
      destination: quote.destination
    };
    
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    
    // Create booking
    const booking = await Booking.create(bookingData);
    
    console.log('Successfully created booking:', booking._id);
    console.log('Booking details:', booking);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating test booking:', error);
    process.exit(1);
  }
}

createTestBooking();

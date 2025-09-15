const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Import models
const Booking = require('../models/Booking');

/**
 * Script to update existing bookings with claimedAmount field and correct payment status
 * This ensures all existing bookings are compatible with the new partial payment system
 */
const updateBookingPaymentStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    // Find all bookings
    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each booking
    for (const booking of bookings) {
      console.log(`\nProcessing booking: ${booking.bookingId || booking._id}`);
      
      // Initialize fields if they don't exist
      if (!booking.claimedAmount) {
        booking.claimedAmount = 0;
      }
      
      if (!booking.paymentClaims) {
        booking.paymentClaims = [];
      }

      // If payment is already claimed, set claimedAmount to totalAmount
      if (booking.paymentClaimed === true && booking.paymentStatus === 'paid') {
        booking.claimedAmount = booking.totalAmount || 0;
        
        // Add a historical claim record if none exists
        if (booking.paymentClaims.length === 0 && booking.paymentClaimedAt) {
          booking.paymentClaims.push({
            amount: booking.totalAmount || 0,
            claimedBy: booking.paymentClaimedBy || null,
            claimedAt: booking.paymentClaimedAt,
            paymentMethod: booking.paymentDetails?.method || 'wallet',
            transactionId: booking.paymentDetails?.transactionId || `legacy-${booking._id}`
          });
        }
        
        console.log(`  Setting claimed amount to full amount: ${booking.claimedAmount}`);
      } 
      // If payment status is partially_paid but no claimed amount is set
      else if (booking.paymentStatus === 'partially_paid' && booking.claimedAmount === 0) {
        // Set claimed amount to half of total as an estimate
        booking.claimedAmount = (booking.totalAmount || 0) / 2;
        console.log(`  Setting claimed amount for partially paid booking: ${booking.claimedAmount}`);
        
        // Add a historical claim record if none exists
        if (booking.paymentClaims.length === 0) {
          booking.paymentClaims.push({
            amount: booking.claimedAmount,
            claimedBy: booking.paymentClaimedBy || null,
            claimedAt: booking.paymentClaimedAt || new Date(),
            paymentMethod: booking.paymentDetails?.method || 'wallet',
            transactionId: booking.paymentDetails?.transactionId || `legacy-partial-${booking._id}`
          });
        }
      }
      
      // Update payment status based on claimed amount
      const totalAmount = booking.totalAmount || 0;
      
      // Check if the current payment status is valid
      const validPaymentStatuses = ['unpaid', 'partially_paid', 'paid', 'refunded'];
      if (!validPaymentStatuses.includes(booking.paymentStatus)) {
        console.log(`  Invalid payment status found: ${booking.paymentStatus}, converting to valid status`);
      }
      
      if (booking.claimedAmount >= totalAmount && totalAmount > 0) {
        booking.paymentStatus = 'paid';
        booking.paymentClaimed = true;
        console.log(`  Setting payment status to: paid (full amount claimed)`);
      } else if (booking.claimedAmount > 0) {
        booking.paymentStatus = 'partially_paid';
        console.log(`  Setting payment status to: partially_paid (${booking.claimedAmount}/${totalAmount})`);
      } else {
        booking.paymentStatus = 'unpaid';
        console.log(`  Setting payment status to: unpaid (no amount claimed)`);
      }
      
      // Save the updated booking
      await booking.save();
      console.log(`  Updated booking ${booking.bookingId || booking._id}`);
      updatedCount++;
    }

    console.log(`\nUpdate complete. Updated ${updatedCount} bookings, skipped ${skippedCount} bookings.`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the function
updateBookingPaymentStatus();

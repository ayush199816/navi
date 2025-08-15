const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import the Booking model
const Booking = require('./models/Booking');

// Test function to update a booking status
const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    console.log(`Attempting to update booking ${bookingId} to status: ${newStatus}`);
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('Booking not found');
      return;
    }
    
    console.log('Current booking status:', booking.bookingStatus);
    
    // Update the status
    booking.bookingStatus = newStatus;
    booking.lastUpdated = Date.now();
    
    // Save the booking
    await booking.save();
    
    console.log('Booking status updated successfully to:', newStatus);
    console.log('Updated booking:', booking);
  } catch (err) {
    console.error('Error updating booking status:', err);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
};

// Get command line arguments
const bookingId = process.argv[2];
const newStatus = process.argv[3];

if (!bookingId || !newStatus) {
  console.error('Usage: node testStatusUpdate.js <bookingId> <newStatus>');
  process.exit(1);
}

// Run the test
updateBookingStatus(bookingId, newStatus);

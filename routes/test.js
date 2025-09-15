const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Test route to check if status update works directly
router.post('/update-status', async (req, res) => {
  try {
    console.log('Test update status request received');
    console.log('Request body:', req.body);
    
    const { bookingId, status } = req.body;
    
    if (!bookingId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId and status'
      });
    }
    
    console.log(`Attempting to update booking ${bookingId} to status: ${status}`);
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log('Current booking status:', booking.bookingStatus);
    
    // Update the status
    booking.bookingStatus = status;
    booking.lastUpdated = Date.now();
    
    // Save the booking
    await booking.save();
    
    console.log('Booking status updated successfully to:', status);
    
    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking
    });
  } catch (err) {
    console.error('Error in test update status:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

module.exports = router;

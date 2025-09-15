const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @desc    Update booking status - simplified endpoint
// @route   POST /api/booking-status/update/:id
// @access  Private/Operations
router.post('/update/:id', protect, authorize('admin', 'operations'), async (req, res) => {
  try {
    console.log('=== SIMPLIFIED STATUS UPDATE ENDPOINT ===');
    console.log('Request received for booking ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Get status from request body
    const { status } = req.body;
    
    if (!status) {
      console.log('Status is missing');
      return res.status(400).json({
        success: false,
        message: 'Please provide a status'
      });
    }
    
    // Valid statuses
    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed', 'processing', 'booked'];
    
    // Case insensitive check
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      console.log('Invalid status:', status);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
      });
    }
    
    // Find booking
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      console.log('Booking not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log(`Updating status from ${booking.bookingStatus} to ${normalizedStatus}`);
    
    // Update booking
    booking.bookingStatus = normalizedStatus;
    booking.lastUpdated = Date.now();
    if (req.user) {
      booking.handledBy = req.user.id;
    }
    
    await booking.save();
    
    console.log('Booking status updated successfully');
    
    res.status(200).json({
      success: true,
      message: `Booking status updated to ${normalizedStatus}`,
      data: booking
    });
    
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;

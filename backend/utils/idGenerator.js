const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const Seller = require('../models/Seller');

/**
 * Generate a unique quote ID with format QT-YYYYMMDD-XXXX
 * where XXXX is a sequential number
 */
exports.generateQuoteId = async () => {
  try {
    // Get current date in YYYYMMDD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Find the latest quote with today's date prefix
    const prefix = `QT-${dateString}-`;
    const latestQuote = await Quote.findOne({
      quoteId: new RegExp(`^${prefix}`)
    }).sort({ quoteId: -1 });
    
    let sequenceNumber = 1;
    
    // If a quote with today's date exists, increment the sequence number
    if (latestQuote && latestQuote.quoteId) {
      const parts = latestQuote.quoteId.split('-');
      if (parts.length === 3) {
        sequenceNumber = parseInt(parts[2], 10) + 1;
      }
    }
    
    // Format the sequence number with leading zeros
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // Create the final ID
    return `${prefix}${formattedSequence}`;
  } catch (err) {
    console.error('Error generating quote ID:', err);
    // Fallback to timestamp-based ID if there's an error
    return `QT-${Date.now()}`;
  }
};

/**
 * Generate a unique booking ID with format BK-YYYYMMDD-XXXX
 * where XXXX is a sequential number
 */
exports.generateBookingId = async () => {
  try {
    // Get current date in YYYYMMDD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Find the latest booking with today's date prefix
    const prefix = `BK-${dateString}-`;
    const latestBooking = await Booking.findOne({
      bookingId: new RegExp(`^${prefix}`)
    }).sort({ bookingId: -1 });
    
    let sequenceNumber = 1;
    
    // If a booking with today's date exists, increment the sequence number
    if (latestBooking && latestBooking.bookingId) {
      const parts = latestBooking.bookingId.split('-');
      if (parts.length === 3) {
        sequenceNumber = parseInt(parts[2], 10) + 1;
      }
    }
    
    // Format the sequence number with leading zeros
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // Create the final ID
    return `${prefix}${formattedSequence}`;
  } catch (err) {
    console.error('Error generating booking ID:', err);
    // Fallback to timestamp-based ID if there's an error
    return `BK-${Date.now()}`;
  }
};

/**
 * Generate a unique seller ID with format SL-YYYYMMDD-XXXX
 * where XXXX is a sequential number
 */
exports.generateSellerId = async () => {
  try {
    // Get current date in YYYYMMDD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Find the latest seller with today's date prefix
    const prefix = `SL-${dateString}-`;
    const latestSeller = await Seller.findOne({
      sellerId: new RegExp(`^${prefix}`)
    }).sort({ sellerId: -1 });
    
    let sequenceNumber = 1;
    
    // If a seller with today's date exists, increment the sequence number
    if (latestSeller && latestSeller.sellerId) {
      const parts = latestSeller.sellerId.split('-');
      if (parts.length === 3) {
        sequenceNumber = parseInt(parts[2], 10) + 1;
      }
    }
    
    // Format the sequence number with leading zeros
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // Create the final ID
    return `${prefix}${formattedSequence}`;
  } catch (err) {
    console.error('Error generating seller ID:', err);
    // Fallback to timestamp-based ID if there's an error
    return `SL-${Date.now()}`;
  }
};

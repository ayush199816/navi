const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const Itinerary = require('../models/Itinerary');
const Quote = require('../models/Quote');

// @desc    Get booking stats
// @route   GET /api/bookings/stats
// @access  Private/Agent
exports.getBookingStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const total = await Booking.countDocuments({ agent: agentId });
    const active = await Booking.countDocuments({ 
      agent: agentId,
      status: { $in: ['confirmed', 'in-progress'] }
    });

    res.status(200).json({
      success: true,
      total,
      active
    });
  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting booking stats'
    });
  }
};

// @desc    Get lead stats
// @route   GET /api/leads/stats
// @access  Private/Agent
exports.getLeadStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const total = await Lead.countDocuments({ assignedTo: agentId });
    const newLeads = await Lead.countDocuments({ 
      assignedTo: agentId,
      status: 'new'
    });

    res.status(200).json({
      success: true,
      total,
      new: newLeads
    });
  } catch (error) {
    console.error('Error getting lead stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting lead stats'
    });
  }
};

// @desc    Get itinerary stats
// @route   GET /api/itineraries/stats
// @access  Private/Agent
exports.getItineraryStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const total = await Itinerary.countDocuments({ createdBy: agentId });

    res.status(200).json({
      success: true,
      total
    });
  } catch (error) {
    console.error('Error getting itinerary stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting itinerary stats'
    });
  }
};

// @desc    Get quote stats
// @route   GET /api/stats/quotes
// @access  Private/Agent
exports.getQuoteStats = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const total = await Quote.countDocuments({ agent: agentId });
    const pending = await Quote.countDocuments({ 
      agent: agentId,
      status: 'pending' 
    });
    const active = await Quote.countDocuments({
      agent: agentId,
      status: { $in: ['responded', 'accepted'] }
    });

    res.status(200).json({
      success: true,
      total,
      pending,
      active
    });
  } catch (error) {
    console.error('Error getting quote stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting quote stats'
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/activity/recent
// @access  Private/Agent
exports.getRecentActivity = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    // Get recent bookings
    const recentBookings = await Booking.find({ agent: agentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('bookingNumber customerName status createdAt')
      .lean();

    // Get recent quotes
    const recentQuotes = await Quote.find({ agent: agentId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('quoteNumber customerName status createdAt')
      .lean();

    // Combine and sort activities
    const activities = [
      ...recentBookings.map(b => ({
        type: 'booking',
        id: b._id,
        reference: b.bookingNumber,
        customer: b.customerName,
        status: b.status,
        date: b.createdAt
      })),
      ...recentQuotes.map(q => ({
        type: 'quote',
        id: q._id,
        reference: q.quoteNumber,
        customer: q.customerName,
        status: q.status,
        date: q.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting recent activity'
    });
  }
};

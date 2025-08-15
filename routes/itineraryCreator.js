const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Itinerary = require('../models/Itinerary');
const { protect, authorize, isApprovedAgent } = require('../middleware/auth');

// List all itineraries with agent IDs (for debugging)
router.get('/debug/list', async (req, res) => {
  try {
    const itineraries = await Itinerary.find({})
      .select('_id title createdBy createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get unique agent IDs
    const agentIds = [...new Set(itineraries.map(i => i.createdBy?.toString()))];
    
    res.status(200).json({
      success: true,
      count: itineraries.length,
      agentIds,
      data: itineraries
    });
  } catch (error) {
    console.error('Error listing itineraries:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply auth middleware to all routes
router.use(protect);

// Get all itineraries for the logged-in agent
router.get('/agent', authorize('agent'), isApprovedAgent, async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const agentId = req.user?.id;
    
    if (!agentId) {
      console.log('No user ID found in request');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    console.log(`Fetching itineraries for agent: ${agentId}`);
    
    const itineraries = await Itinerary.find({ createdBy: agentId })
      .select('title destination arrivalDate departureDate status createdAt')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: itineraries.length,
      data: itineraries
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  console.log('GET /api/v1/itinerary-creator/test called');
  res.status(200).json({ 
    success: true, 
    message: 'Itinerary creator routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Create itinerary with full data structure
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  // Log request start
  console.log('=== NEW ITINERARY REQUEST ===');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    // Log request size
    const requestSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    console.log(`Request size: ${(requestSize / 1024).toFixed(2)} KB`);
    
    // Start timing data processing
    const processStart = process.hrtime();
    
    // Format the itinerary data with all fields from the form
    const itineraryData = {
      // Basic information
      title: req.body.title || 'Untitled Itinerary',
      destination: req.body.destination || 'Not specified',
      arrivalDate: req.body.arrivalDate ? new Date(req.body.arrivalDate) : new Date(),
      departureDate: req.body.departureDate ? new Date(req.body.departureDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      adults: Number(req.body.adults) || 1,
      children: Number(req.body.children) || 0,
      notes: req.body.notes || '',
      status: 'draft',
      createdBy: new mongoose.Types.ObjectId('5f8d0a8b7f4bfa0a3c4d5e6f'),
      
      // Travel preferences
      travelStyle: req.body.travelStyle || 'leisure',
      budget: req.body.budget || 'medium',
      interests: Array.isArray(req.body.interests) ? req.body.interests : [],
      
      // Accommodations
      hotels: Array.isArray(req.body.hotels) ? req.body.hotels.map(hotel => ({
        name: hotel.name || 'Unnamed Hotel',
        checkIn: hotel.checkIn ? new Date(hotel.checkIn) : null,
        checkOut: hotel.checkOut ? new Date(hotel.checkOut) : null,
        confirmationNumber: hotel.confirmationNumber || '',
        address: hotel.address || '',
        phone: hotel.phone || '',
        roomType: hotel.roomType || '',
        notes: hotel.notes || ''
      })) : [],
      
      // Transportation
      flights: Array.isArray(req.body.flights) ? req.body.flights.map(flight => ({
        airline: flight.airline || '',
        flightNumber: flight.flightNumber || '',
        from: flight.from || 'Not specified',
        to: flight.to || 'Not specified',
        departure: flight.departure ? new Date(flight.departure) : null,
        arrival: flight.arrival ? new Date(flight.arrival) : null,
        confirmationNumber: flight.confirmationNumber || '',
        seat: flight.seat || '',
        notes: flight.notes || ''
      })) : [],
      
      // Activities and itinerary days
      days: Array.isArray(req.body.days) ? req.body.days.map(day => ({
        date: day.date ? new Date(day.date) : new Date(),
        title: day.title || '',
        description: day.description || '',
        activities: Array.isArray(day.activities) ? day.activities.map(activity => ({
          name: activity.name || 'Unnamed Activity',
          type: activity.type || 'activity',
          description: activity.description || '',
          location: activity.location || '',
          time: activity.time ? new Date(activity.time) : null,
          duration: activity.duration || 60, // in minutes
          cost: activity.cost || 0,
          notes: activity.notes || '',
          bookingReference: activity.bookingReference || ''
        })) : []
      })) : [],
      
      // Additional information
      emergencyContacts: Array.isArray(req.body.emergencyContacts) ? req.body.emergencyContacts : [],
      documents: Array.isArray(req.body.documents) ? req.body.documents : [],
      
      // Metadata
      isPublic: Boolean(req.body.isPublic) || false,
      tags: Array.isArray(req.body.tags) ? req.body.tags : []
    };

    console.log('Creating itinerary with data:', JSON.stringify(itineraryData, null, 2));
    
    // Log data processing time
    const processEnd = process.hrtime(processStart);
    console.log(`Data processing took: ${processEnd[0]}s ${processEnd[1] / 1000000}ms`);
    
    // Save to database
    console.log('Saving to database...');
    const dbStart = process.hrtime();
    const itinerary = await Itinerary.create(itineraryData);
    const dbEnd = process.hrtime(dbStart);
    
    console.log(`Database save took: ${dbEnd[0]}s ${dbEnd[1] / 1000000}ms`);
    
    // Calculate total time
    const totalTime = Date.now() - startTime;
    console.log(`Total request time: ${totalTime}ms`);
    
    res.status(201).json({
      success: true,
      data: itinerary,
      timing: {
        total: totalTime,
        processing: processEnd[0] * 1000 + processEnd[1] / 1000000,
        database: dbEnd[0] * 1000 + dbEnd[1] / 1000000
      }
    });
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        stack: error.stack,
        errors: error.errors
      } : undefined
    });
  }
});

module.exports = router;

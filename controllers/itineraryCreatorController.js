const Itinerary = require('../models/Itinerary');

// @desc    Create a new itinerary
// @route   POST /api/v1/itinerary-creator
// @access  Public (temporarily for testing)
exports.createItinerary = async (req, res) => {
  try {
    console.log('Creating itinerary with data:', req.body);
    
    const itinerary = await Itinerary.create({
      ...req.body,
      createdBy: req.user?.id || 'test-user-id'
    });

    console.log('Itinerary created successfully:', itinerary);
    
    return res.status(201).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

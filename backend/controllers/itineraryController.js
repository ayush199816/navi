const Itinerary = require('../models/Itinerary');
const User = require('../models/User');
const Quote = require('../models/Quote');
const ErrorResponse = require('../utils/errorResponse');

// Mock AI service for generating itineraries
// In a production environment, this would be replaced with an actual OpenAI API call
const generateAIItinerary = async (destination, duration, preferences) => {
  // Sample itinerary structure
  const days = [];
  
  for (let i = 1; i <= duration; i++) {
    days.push({
      day: i,
      title: `Day ${i} in ${destination}`,
      description: `Explore the beauty of ${destination} on day ${i} of your journey.`,
      activities: [
        {
          time: '09:00 AM',
          title: `Morning activity in ${destination}`,
          description: `Enjoy a refreshing morning in ${destination} with activities tailored to your preferences.`,
          location: `${destination} Central Area`
        },
        {
          time: '01:00 PM',
          title: 'Lunch break',
          description: 'Enjoy local cuisine at a popular restaurant.',
          location: 'Local Restaurant'
        },
        {
          time: '03:00 PM',
          title: `Afternoon exploration in ${destination}`,
          description: `Discover the hidden gems of ${destination} during your afternoon adventure.`,
          location: `${destination} Tourist Spot`
        },
        {
          time: '07:00 PM',
          title: 'Dinner',
          description: 'Experience the local nightlife and cuisine.',
          location: 'Downtown Area'
        }
      ],
      accommodation: {
        name: `${destination} Luxury Hotel`,
        description: '4-star accommodation with all amenities',
        location: `${destination} Downtown`
      },
      meals: {
        breakfast: true,
        lunch: false,
        dinner: true
      }
    });
  }
  
  // Customize based on preferences
  if (preferences) {
    if (preferences.includes('adventure')) {
      days.forEach(day => {
        day.activities.push({
          time: '04:30 PM',
          title: 'Adventure Activity',
          description: 'Exciting adventure activity like hiking, paragliding, or water sports.',
          location: 'Adventure Zone'
        });
      });
    }
    
    if (preferences.includes('culture')) {
      days.forEach(day => {
        day.activities.push({
          time: '05:30 PM',
          title: 'Cultural Experience',
          description: 'Visit to local museums, heritage sites, or cultural performances.',
          location: 'Cultural Center'
        });
      });
    }
    
    if (preferences.includes('relaxation')) {
      days.forEach(day => {
        day.activities.push({
          time: '06:00 PM',
          title: 'Spa & Wellness',
          description: 'Relaxing spa treatment or wellness activity.',
          location: 'Wellness Center'
        });
      });
    }
  }
  
  return {
    destination,
    duration,
    days,
    overview: `A ${duration}-day journey through the beautiful ${destination}, tailored to your preferences. Enjoy the perfect balance of exploration, relaxation, and authentic experiences.`,
    highlights: [
      `Explore the best of ${destination}`,
      'Experience local cuisine and culture',
      'Stay in comfortable accommodations',
      'Perfectly balanced itinerary for an unforgettable experience'
    ]
  };
};

// @desc    Create new itinerary
// @route   POST /api/itineraries
// @access  Private/Agent
exports.createItinerary = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Check for published agent
    if (req.user.role === 'agent' && !req.user.isApproved) {
      return next(
        new ErrorResponse('Please get your account approved before creating itineraries', 400)
      );
    }

    const itinerary = await Itinerary.create(req.body);

    res.status(201).json({
      success: true,
      data: itinerary
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all itineraries (for admin)
// @route   GET /api/itineraries
// @access  Private/Admin
exports.getItineraries = async (req, res) => {
  try {
    const { agentId, destination, minDuration, maxDuration, search } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by agent
    if (agentId) {
      query.agent = agentId;
    }
    
    // Filter by destination
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    
    // Filter by duration range
    if (minDuration || maxDuration) {
      query.duration = {};
      if (minDuration) query.duration.$gte = parseInt(minDuration);
      if (maxDuration) query.duration.$lte = parseInt(maxDuration);
    }
    
    // Search by name or destination
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const itineraries = await Itinerary.find(query)
      .populate('agent', 'name email companyName')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Itinerary.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: itineraries.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: itineraries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get itineraries by agent (for agents to see their own itineraries)
// @route   GET /api/itineraries/my-itineraries
// @access  Private/Agent
exports.getMyItineraries = async (req, res) => {
  try {
    const { destination, minDuration, maxDuration, search } = req.query;
    
    // Build query
    const query = {
      agent: req.user.id
    };
    
    // Filter by destination
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    
    // Filter by duration range
    if (minDuration || maxDuration) {
      query.duration = {};
      if (minDuration) query.duration.$gte = parseInt(minDuration);
      if (maxDuration) query.duration.$lte = parseInt(maxDuration);
    }
    
    // Search by name or destination
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const itineraries = await Itinerary.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Itinerary.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: itineraries.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: itineraries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single itinerary
// @route   GET /api/itineraries/:id
// @access  Private
exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id)
      .populate('agent', 'name email companyName');
    
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }
    
    // Check if user is authorized to view this itinerary
    if (req.user.role === 'agent' && itinerary.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this itinerary',
      });
    }
    
    res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Generate AI itinerary
// @route   POST /api/itineraries/generate
// @access  Private/Agent
exports.generateItinerary = async (req, res) => {
  try {
    const { destination, duration, preferences, name, travelType, budget } = req.body;
    
    if (!destination || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide destination and duration',
      });
    }
    
    // Generate AI itinerary
    const aiItinerary = await generateAIItinerary(destination, duration, preferences);
    
    // Create itinerary object
    const itinerary = await Itinerary.create({
      name: name || `${duration}-Day Trip to ${destination}`,
      agent: req.user.id,
      destination,
      duration,
      travelType: travelType || 'leisure',
      budget: budget || 'medium',
      preferences,
      days: aiItinerary.days,
      overview: aiItinerary.overview,
      highlights: aiItinerary.highlights
    });
    
    res.status(201).json({
      success: true,
      data: itinerary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update itinerary
// @route   PUT /api/itineraries/:id
// @access  Private/Agent
exports.updateItinerary = async (req, res) => {
  try {
    let itinerary = await Itinerary.findById(req.params.id);
    
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }
    
    // Check if user is the agent who created the itinerary
    if (itinerary.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this itinerary',
      });
    }
    
    // Update itinerary
    itinerary = await Itinerary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create quote from itinerary
// @route   POST /api/itineraries/:id/quote
// @access  Private/Agent
exports.createQuoteFromItinerary = async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, budget, travelDates } = req.body;
    
    const itinerary = await Itinerary.findById(req.params.id);
    
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }
    
    // Check if user is the agent who created the itinerary
    if (itinerary.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create a quote from this itinerary',
      });
    }
    
    // Create quote from itinerary
    const quote = await Quote.create({
      agent: req.user.id,
      customerName,
      customerEmail,
      customerPhone,
      destination: itinerary.destination,
      travelDates,
      duration: itinerary.duration,
      travelType: itinerary.travelType,
      budget: budget || itinerary.budget,
      requirements: `Based on itinerary: ${itinerary.name}`,
      status: 'pending',
      itineraryDetails: {
        itineraryId: itinerary._id,
        overview: itinerary.overview,
        highlights: itinerary.highlights,
        days: itinerary.days
      }
    });
    
    res.status(201).json({
      success: true,
      data: quote,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete itinerary
// @route   DELETE /api/itineraries/:id
// @access  Private/Agent/Admin
exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found',
      });
    }
    
    // Check if user is authorized to delete this itinerary
    if (req.user.role !== 'admin' && itinerary.agent.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this itinerary',
      });
    }
    
    await itinerary.remove();
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

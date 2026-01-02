const express = require('express');
const router = express.Router();
const {
  getItineraries,
  getMyItineraries,
  getItinerary,
  generateItinerary,
  updateItinerary,
  createItinerary,
  createQuoteFromItinerary,
  deleteItinerary
} = require('../controllers/itineraryController');
const { protect, authorize, isApprovedAgent } = require('../middleware/auth');

// Protected routes
router.use(protect);

// Routes for all authenticated users
router.get('/:id', authorize('agent', 'operations'), isApprovedAgent, getItinerary);

// Routes for agents
router.get('/my-itineraries', authorize('agent', 'operations'), isApprovedAgent, getMyItineraries);
router.post('/', authorize('agent', 'operations'), isApprovedAgent, createItinerary);
router.post('/generate', authorize('agent', 'operations'), isApprovedAgent, generateItinerary);
router.put('/:id', authorize('agent', 'operations'), isApprovedAgent, updateItinerary);
router.post('/:id/quote', authorize('agent', 'operations'), isApprovedAgent, createQuoteFromItinerary);

// Routes for admin
router.get('/', authorize('admin'), getItineraries);

// Routes for agent, admin and operations
router.delete('/:id', authorize('admin', 'agent', 'operations'), deleteItinerary);

module.exports = router;

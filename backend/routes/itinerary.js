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
router.get('/:id', getItinerary);

// Routes for agents
router.get('/my-itineraries', authorize('agent'), isApprovedAgent, getMyItineraries);
router.post('/', authorize('agent'), isApprovedAgent, createItinerary);
router.post('/generate', authorize('agent'), isApprovedAgent, generateItinerary);
router.put('/:id', authorize('agent'), isApprovedAgent, updateItinerary);
router.post('/:id/quote', authorize('agent'), isApprovedAgent, createQuoteFromItinerary);

// Routes for admin
router.get('/', authorize('admin'), getItineraries);

// Routes for agent and admin
router.delete('/:id', authorize('admin', 'agent'), deleteItinerary);

module.exports = router;

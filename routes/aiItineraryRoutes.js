const express = require('express');
const router = express.Router();
const aiItineraryController = require('../controllers/aiItineraryController');
const { protect } = require('../middleware/auth');

console.log('AI Itinerary Routes loaded'); // Debug log

// Public route for generating itineraries
console.log('Registering POST /api/v1/ai-itinerary/generate'); // Debug log
router.post('/generate', (req, res, next) => {
  console.log('Received request to /api/v1/ai-itinerary/generate');
  next();
}, aiItineraryController.generateItinerary);

module.exports = router;

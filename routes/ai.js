const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generateAIItinerary } = require('../controllers/aiController');

// Public route - AI Itinerary generation endpoint
router.post('/itinerary', generateAIItinerary);

// Protected routes (all routes below this will require authentication)
router.use(protect);

// Add other protected routes here if needed

module.exports = router;

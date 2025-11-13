const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generateAIItinerary } = require('../controllers/aiController');
const { chatWithAI } = require('../controllers/chatController');

// Public route - AI Itinerary generation endpoint
router.post('/itinerary', generateAIItinerary);

// Protected routes (all routes below this will require authentication)
router.use(protect);

// AI Chat endpoint
router.post('/chat', chatWithAI);

module.exports = router;

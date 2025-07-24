const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { generateAIItinerary } = require('../controllers/aiController');

// Protected routes
router.use(protect);

// AI Itinerary generation endpoint - accessible to admin, operations, and agents
router.post('/itinerary', authorize('admin', 'operations', 'agent'), generateAIItinerary);

module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');
const GuestSightseeing = require('../models/GuestSightseeing');
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const upload = require('../middleware/upload');

const {
  getGuestSightseeings,
  getGuestSightseeing,
  createGuestSightseeing,
  updateGuestSightseeing,
  deleteGuestSightseeing,
  uploadGuestSightseeingImages
} = require('../controllers/guestSightseeingController');

// Create a new router for public routes
const publicRouter = express.Router();

// Public test endpoint - no authentication required
publicRouter.get('/test', async (req, res) => {
  try {
    console.log('🔍 [TEST] Checking database connection...');
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'guestsightseeings');
    
    if (!collectionExists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Collection not found',
        availableCollections: collections.map(c => c.name)
      });
    }
    
    // Count all documents
    const count = await GuestSightseeing.countDocuments();
    console.log(`✅ Found ${count} documents in collection`);
    
    // Get all documents
    const allData = await GuestSightseeing.find({}).lean();
    console.log(`📄 Retrieved ${allData.length} documents`);
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    
    res.status(200).json({ 
      success: true, 
      count,
      collection: 'guestsightseeings',
      stats: {
        size: stats.size,
        count: stats.count,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize
      },
      sampleData: allData.slice(0, 5) // Return first 5 documents
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mount public routes first
router.use(publicRouter);

// Protected routes
router.route('/')
  .get(advancedResults(GuestSightseeing), getGuestSightseeings)
  .post(protect, authorize('admin'), createGuestSightseeing);

// Upload images route
router.post(
  '/upload',
  protect,
  authorize('admin'),
  upload.array('sightseeingImages', 10), // 'sightseeingImages' is the field name, max 10 files
  uploadGuestSightseeingImages
);

// Get single guest sightseeing by ID
router.get('/:id', getGuestSightseeing);

// Update and delete routes with proper authorization
router.route('/:id')
  .put(protect, authorize('admin'), updateGuestSightseeing)
  .delete(protect, authorize('admin'), deleteGuestSightseeing);

module.exports = router;

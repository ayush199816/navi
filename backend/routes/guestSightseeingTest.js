const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GuestSightseeing = require('../models/GuestSightseeing');

// Public test endpoint - no authentication required
router.get('/test', async (req, res) => {
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

module.exports = router;

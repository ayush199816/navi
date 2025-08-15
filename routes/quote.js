const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getQuotes,
  getMyQuotes,
  getQuote,
  createQuote,
  updateQuote,
  respondToQuote,
  deleteQuote,
  createQuoteFromPackage
} = require('../controllers/quoteController');
const { protect, authorize, isApprovedAgent } = require('../middleware/auth');

// Set up multer storage for quote images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/quotes';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `quote-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protected routes
router.use(protect);

// Routes for agents
router.get('/my-quotes', authorize('agent'), isApprovedAgent, getMyQuotes);
router.post('/from-package', authorize('agent'), isApprovedAgent, createQuoteFromPackage);

// Routes for all authenticated users
router.get('/:id', getQuote);
router.post('/', authorize('agent'), isApprovedAgent, upload.array('images', 5), createQuote);
// Route for agents to respond to quotes
router.put('/:id/response', authorize('agent'), isApprovedAgent, respondToQuote);

// Routes for operations team, admin, and sales
router.get('/', authorize('admin', 'operations', 'sales'), getQuotes);
router.put('/:id', authorize('admin', 'operations'), updateQuote);

// Routes for admin only
router.delete('/:id', authorize('admin'), deleteQuote);

module.exports = router;

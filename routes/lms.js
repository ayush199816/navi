const express = require('express');
const router = express.Router();
const {
  getAllContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  updateProgress,
  getProgressSummary
} = require('../controllers/lmsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadLmsContent } = require('../middleware/upload');

// Protected routes
router.use(protect);

// Routes for all authenticated users
router.get('/content', getAllContent);
router.get('/content/:id', getContent);
router.get('/progress', getProgressSummary);
router.put('/progress/:contentId', updateProgress);

// Routes for admin only
router.post(
  '/content',
  authorize('admin'),
  uploadLmsContent.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createContent
);
router.put(
  '/content/:id',
  authorize('admin'),
  uploadLmsContent.fields([
    { name: 'contentFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  updateContent
);
router.delete('/content/:id', authorize('admin'), deleteContent);

module.exports = router;

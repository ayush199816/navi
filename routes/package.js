const express = require('express');
const router = express.Router();
const {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  uploadPackageImages,
  removePackageImage,
  togglePackageStatus,
  getPackageStats
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected routes
router.use(protect);

// Routes accessible to all authenticated users
router.get('/stats', getPackageStats);
router.get('/', getPackages);
router.get('/:id', getPackage);

// Routes for Operations team and Admin
router.post('/', authorize('admin', 'operations'), upload.array('packageImages', 10), createPackage);
router.put('/:id', authorize('admin', 'operations'), updatePackage);
router.delete('/:id', authorize('admin', 'operations'), deletePackage);
router.put('/:id/images', authorize('admin', 'operations'), upload.array('packageImages', 10), uploadPackageImages);
router.delete('/:id/images/:imageIndex', authorize('admin', 'operations'), removePackageImage);
router.put('/:id/toggle-status', authorize('admin', 'operations'), togglePackageStatus);

module.exports = router;

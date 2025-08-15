const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createClaim,
  getAllClaims,
  getMyClaims,
  getClaimById,
  updateClaimStatus,
  getClaimStats
} = require('../controllers/claimController');

// Agent routes
router.route('/').post(protect, authorize('agent'), createClaim);
router.route('/my-claims').get(protect, authorize('agent'), getMyClaims);

// Admin/Operations routes
router.route('/').get(protect, authorize('admin', 'operations'), getAllClaims);
router.route('/stats').get(protect, authorize('admin', 'operations'), getClaimStats);
router.route('/:id/status').put(protect, authorize('admin', 'operations'), updateClaimStatus);

// Shared routes
router.route('/:id').get(protect, getClaimById);

module.exports = router;

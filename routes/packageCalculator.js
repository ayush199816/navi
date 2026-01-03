const express = require('express');
const router = express.Router();
const {
  getPackageCalculators,
  getPackageCalculator,
  createPackageCalculator,
  updatePackageCalculator,
  deletePackageCalculator,
  getAvailableSightseeings,
  getAvailableTransfers,
  calculatePackageCost
} = require('../controllers/packageCalculatorController');

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin', 'operations'), getPackageCalculators)
  .post(protect, authorize('admin', 'operations'), createPackageCalculator);

router
  .route('/sightseeings')
  .get(protect, authorize('admin', 'operations'), getAvailableSightseeings);

router
  .route('/transfers')
  .get(protect, authorize('admin', 'operations'), getAvailableTransfers);

router
  .route('/calculate')
  .post(protect, authorize('admin', 'operations'), calculatePackageCost);

router
  .route('/:id')
  .get(protect, authorize('admin', 'operations'), getPackageCalculator)
  .put(protect, authorize('admin', 'operations'), updatePackageCalculator)
  .delete(protect, authorize('admin'), deletePackageCalculator);

module.exports = router;

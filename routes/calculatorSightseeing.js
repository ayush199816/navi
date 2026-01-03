const express = require('express');
const router = express.Router();
const {
  getCalculatorSightseeings,
  getCalculatorSightseeing,
  createCalculatorSightseeing,
  updateCalculatorSightseeing,
  deleteCalculatorSightseeing,
  toggleCalculatorSightseeing
} = require('../controllers/calculatorSightseeingController');

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin', 'operations'), getCalculatorSightseeings)
  .post(protect, authorize('admin', 'operations'), createCalculatorSightseeing);

router
  .route('/:id')
  .get(protect, authorize('admin', 'operations'), getCalculatorSightseeing)
  .put(protect, authorize('admin', 'operations'), updateCalculatorSightseeing)
  .delete(protect, authorize('admin'), deleteCalculatorSightseeing);

router
  .route('/:id/toggle')
  .patch(protect, authorize('admin', 'operations'), toggleCalculatorSightseeing);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getCalculatorTransfers,
  getCalculatorTransfer,
  createCalculatorTransfer,
  updateCalculatorTransfer,
  deleteCalculatorTransfer,
  toggleCalculatorTransfer
} = require('../controllers/calculatorTransferController');

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin', 'operations'), getCalculatorTransfers)
  .post(protect, authorize('admin', 'operations'), createCalculatorTransfer);

router
  .route('/:id')
  .get(protect, authorize('admin', 'operations'), getCalculatorTransfer)
  .put(protect, authorize('admin', 'operations'), updateCalculatorTransfer)
  .delete(protect, authorize('admin'), deleteCalculatorTransfer);

router
  .route('/:id/toggle')
  .patch(protect, authorize('admin', 'operations'), toggleCalculatorTransfer);

module.exports = router;

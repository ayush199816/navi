const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllSellers,
  getSellerById,
  createSeller,
  updateSeller,
  deleteSeller
} = require('../controllers/sellerController');

// Routes for /api/sellers
router
  .route('/')
  .get(protect, authorize('admin', 'operations'), getAllSellers)
  .post(protect, authorize('admin', 'operations'), createSeller);

router
  .route('/:id')
  .get(protect, getSellerById)
  .put(protect, authorize('admin', 'operations'), updateSeller)
  .delete(protect, authorize('admin'), deleteSeller);

module.exports = router;

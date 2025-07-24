const express = require('express');
const router = express.Router();
const {
  getWalletByUserId,
  getMyWallet,
  updateCreditLimit,
  addTransaction,
  getAllWallets,
  getTransactionHistory
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.use(protect);

// Agent routes
router.get('/my-wallet', authorize('agent'), getMyWallet);

// Admin and Sales routes
router.get('/', authorize('admin', 'sales'), getAllWallets);
router.get('/:userId', authorize('admin', 'sales', 'accounts'), getWalletByUserId);
router.put('/:userId/credit-limit', authorize('admin', 'sales'), updateCreditLimit);
router.post('/:userId/transaction', authorize('admin', 'sales', 'accounts'), addTransaction);

// Transaction history - accessible by admin, sales, and the agent themselves
router.get('/:userId/transactions', getTransactionHistory);

module.exports = router;

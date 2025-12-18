const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid
} = require('../controllers/invoiceController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Only admin and operations can access invoice routes
router.use(authorize('admin', 'operations'));

router.route('/')
  .post(createInvoice)
  .get(getInvoices);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.route('/:id/mark-paid')
  .put(markAsPaid);

module.exports = router;

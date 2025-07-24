const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const {
  getSalesLeads,
  getSalesLead,
  createSalesLead,
  updateSalesLead,
  deleteSalesLead
} = require('../controllers/salesLeadController');

// All routes are protected and require authentication
router.use(protect);

// Route for getting all sales leads and creating new ones
router
  .route('/')
  .get(authorize('admin', 'operations', 'sales'), getSalesLeads)
  .post(authorize('admin', 'operations', 'sales'), createSalesLead);

// Routes for single sales lead operations
router
  .route('/:id')
  .get(authorize('admin', 'operations', 'sales'), getSalesLead)
  .put(authorize('admin', 'operations', 'sales'), updateSalesLead)
  .delete(authorize('admin'), deleteSalesLead);

module.exports = router;

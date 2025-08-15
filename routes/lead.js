const express = require('express');
const router = express.Router();
const {
  getLeads,
  getMyLeads,
  getLead,
  createLead,
  updateLead,
  addLeadNote,
  assignLead,
  deleteLead
} = require('../controllers/leadController');
const { protect, authorize, isApprovedAgent } = require('../middleware/auth');

// Protected routes
router.use(protect);

// Routes for all authenticated users
router.get('/:id', getLead);

// Routes for agents
router.get('/my-leads', authorize('agent'), isApprovedAgent, getMyLeads);
router.post('/', authorize('agent'), isApprovedAgent, createLead);

// Routes for updating leads and adding notes (agents can update their own leads)
router.put('/:id', updateLead);
router.post('/:id/notes', addLeadNote);

// Routes for sales team and admin
router.get('/', authorize('admin', 'sales'), getLeads);
router.put('/:id/assign', authorize('admin', 'sales'), assignLead);

// Routes for admin only
router.delete('/:id', authorize('admin'), deleteLead);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateAgentApproval,
  getPendingApprovals
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Users routes
router.route('/')
  .get(authorize('admin', 'sales', 'operations'), getUsers) // Allow sales and operations to list users
  .post(authorize('admin'), createUser);

// Accounts team routes - must come before :id routes
router.get('/pending-approvals', authorize('admin', 'accounts'), getPendingApprovals);

// User ID specific routes
router.route('/:id')
  .get(authorize('admin'), getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

// User approval route
router.put('/:id/approval', authorize('admin', 'accounts'), updateAgentApproval);

module.exports = router;

const express = require('express');
const router = express.Router();
const sightseeingController = require('../controllers/sightseeingController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all routes with authentication
router.use(protect);

// Public routes (for agents to view)
router.get('/', sightseeingController.getSightseeing);

// Protected routes (admin/operations only)
router.use(authorize('admin', 'operations'));
router.post('/', upload.single('picture'), sightseeingController.createSightseeing);
router.put('/:id', sightseeingController.updateSightseeing);
router.delete('/:id', sightseeingController.deleteSightseeing);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  updatePassword,
  approveAgent,
  rejectAgent,
  getPendingAgents 
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Set up multer for document uploads
const documentUpload = upload.fields([
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'udyamCertificate', maxCount: 1 }
]);

// Public routes
router.post('/register', documentUpload, register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);

// Admin routes for agent approval
router.get('/pending-agents', protect, authorize('admin'), getPendingAgents);
router.put('/users/:id/approve', protect, authorize('admin'), approveAgent);
router.put('/users/:id/reject', protect, authorize('admin'), rejectAgent);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes for operations users
router.post('/', authorize('operations'), markAttendance);
router.get('/me', authorize('operations'), getMyAttendance);
router.get('/today', authorize('operations'), getTodayAttendance);

// Routes for admin and operations to view all attendance
router.get('/', authorize('admin', 'operations'), getAllAttendance);

module.exports = router;

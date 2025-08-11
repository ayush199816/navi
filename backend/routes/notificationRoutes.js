const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} = require('../controllers/notificationController');

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

module.exports = router;

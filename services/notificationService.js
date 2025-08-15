const Notification = require('../models/Notification');
const User = require('../models/User');

// Send notification to specific user
const sendNotification = async (userId, title, message, type = 'quote_response', relatedEntity) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedEntity,
      read: false
    });
    
    // Here you can add real-time notification logic (e.g., WebSocket, Socket.io)
    // For now, we'll just log it
    console.log(`Notification sent to user ${userId}: ${title}`);
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to all operations team members
const notifyOperationsTeam = async (title, message, relatedEntity) => {
  try {
    // Find all operations team members
    const operationsTeam = await User.find({ 
      role: { $in: ['operations', 'admin'] },
      isActive: true
    });
    
    // Send notification to each team member
    const notifications = await Promise.all(
      operationsTeam.map(user => 
        sendNotification(user._id, title, message, 'quote_response', relatedEntity)
      )
    );
    
    return notifications;
  } catch (error) {
    console.error('Error notifying operations team:', error);
    throw error;
  }
};

// Mark notifications as read
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Get user's unread notifications
const getUnreadNotifications = async (userId) => {
  try {
    const notifications = await Notification.find({
      user: userId,
      read: false
    }).sort({ createdAt: -1 });
    
    return notifications;
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  notifyOperationsTeam,
  markAsRead,
  getUnreadNotifications
};

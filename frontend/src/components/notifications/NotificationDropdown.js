import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications, 
  fetchUnreadCount, 
  markNotificationAsRead, 
  markAllAsRead 
} from '../../redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { notifications, unreadCount, loading } = useSelector((state) => ({
    notifications: state.notifications.notifications || [],
    unreadCount: state.notifications.unreadCount || 0,
    loading: state.notifications.loading
  }));

  // Load notifications and refresh unread count when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      // Fetch both notifications and unread count in parallel
      Promise.all([
        dispatch(fetchNotifications()),
        dispatch(fetchUnreadCount())
      ]);
    }
  }, [isOpen, dispatch]);

  // Load unread count on component mount and periodically
  useEffect(() => {
    dispatch(fetchUnreadCount());
    
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await dispatch(markNotificationAsRead(notification._id));
    }
    
    // Navigate to the related entity if needed
    if (notification.relatedEntity) {
      // You can add navigation logic here based on notification type
      console.log('Navigate to:', notification.relatedEntity);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await dispatch(markAllAsRead());
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'quote_response':
        return `/quotes/${notification.relatedEntity?._id || ''}`;
      // Add more cases for different notification types
      default:
        return '#';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification._id}
                    to={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 text-center">
                <Link
                  to="/notifications"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
